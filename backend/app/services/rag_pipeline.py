"""
This is a optimal RAG Pipeline for Infera
This uses Hybrid Retreval strategy using both Dense Vector search and BM25 Search

RRF merges ranked lists 
Cross Encoder reranks the context
"""

import os
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from groq import Groq
from dotenv import load_dotenv
from app.services.embedder import embed_document, embed_query
import re 
from typing import List, Dict, Tuple, Any
from sentence_transformers import CrossEncoder
from app.config import settings
import math 

load_dotenv()

qdrant = QdrantClient (
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    timeout=120,
)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Reranker initialization
_reranker = None
def get_reranker()->CrossEncoder:
    global _reranker
    if _reranker is None:
        print("[reranker] Loading cross-encoder modek...")
        _reranker=CrossEncoder("cross-encoder/ms-macro-MiniLM-L-6-v2")
    return _reranker

# Retrieval parameters configs
DENSE_TOP_K=20 
BM25_TOP_K=20
RRF_K=60
RERANK_TOP_N=5

def ensure_collection(collection_name: str):
    """Ensure a collection exists for a specific user"""
    collections = [c.name for c in qdrant.get_collections().collections]
    if collection_name not in collections:
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE
            )
        )
        print(f"Created collection: {collection_name}")

def store_vectors(vectors:List[Dict[str,Any]], collection_name:str):
    ensure_collection(collection_name)
    points=[
            PointStruct(
                id=v["id"],
                vector=v["embedding"],
                payload=v["payload"]
            )
            for v in vectors
        ]
    qdrant.upsert(collection_name=collection_name,points=points)
    print(f"Stored {len(vectors)} vectors in {collection_name}")

def _dense_search(
    query_vector: List[float],
    collection_name: str,
    top_k: int,
) -> List[Dict[str, Any]]:
    """Return top_k chunks by cosine similarity with their payloads."""
    results = qdrant.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=top_k,
        with_payload=True,
    )
    return [
        {"score": point.score, "payload": point.payload}
        for point in results.points
    ]

def _tokenise_query(query: str) -> List[str]:
    return re.findall(r"\b[a-z]{2,}\b", query.lower())
 
def _bm25_search(
    query: str,
    collection_name: str,
    top_k: int,
    k1: float = 1.5,
    b: float = 0.75,
) -> List[Dict[str, Any]]:
    """
    BM25 formula:
      score(D,Q) = Σ IDF(qi) * [ tf(qi,D)*(k1+1) ] / [ tf(qi,D) + k1*(1-b+b*|D|/avgdl) ]
    IDF is approximated from the fetched corpus on the fly.
    """
    query_terms = _tokenise_query(query)
    if not query_terms:
        return []
    all_points, _ = qdrant.scroll(
        collection_name=collection_name,
        limit=10_000,
        with_payload=True,
        with_vectors=False,
    )
 
    if not all_points:
        return []
 
    corpus = [p.payload for p in all_points]
    N = len(corpus)
    avg_dl = sum(
        sum(p.get("bm25_tf", {}).values()) for p in corpus
    ) / max(N, 1)

    df: Dict[str, int] = {}
    for payload in corpus:
        tf_map = payload.get("bm25_tf", {})
        for term in set(query_terms):
            if term in tf_map:
                df[term] = df.get(term, 0) + 1
 
    idf: Dict[str, float] = {
        term: math.log((N - df.get(term, 0) + 0.5) / (df.get(term, 0) + 0.5) + 1)
        for term in query_terms
    }
    scored = []
    for payload in corpus:
        tf_map = payload.get("bm25_tf", {})
        dl = sum(tf_map.values()) if tf_map else 1.0
        score = 0.0
        for term in query_terms:
            tf = tf_map.get(term, 0.0)
            raw_tf = tf * dl
            numerator = raw_tf * (k1 + 1)
            denominator = raw_tf + k1 * (1 - b + b * dl / max(avg_dl, 1))
            score += idf.get(term, 0.0) * numerator / max(denominator, 1e-9)
 
        if score > 0:
            scored.append({"score": score, "payload": payload})
 
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]

def _rrf_fusion(
    dense_results: List[Dict[str, Any]],
    bm25_results: List[Dict[str, Any]],
    k: int = RRF_K,
) -> List[Dict[str, Any]]:
    """
    Merge dense and BM25 ranked lists using Reciprocal Rank Fusion.
    """
    rrf_scores: Dict[str, float] = {}
    payloads: Dict[str, Dict] = {}
 
    def _chunk_key(payload: Dict) -> str:
        return f"{payload.get('document_id', '')}::{payload.get('chunk_index', '')}"
 
    for rank, item in enumerate(dense_results, start=1):
        key = _chunk_key(item["payload"])
        rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (k + rank)
        payloads[key] = item["payload"]
 
    for rank, item in enumerate(bm25_results, start=1):
        key = _chunk_key(item["payload"])
        rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (k + rank)
        payloads[key] = item["payload"]
 
    fused = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    return [{"rrf_score": score, "payload": payloads[key]} for key, score in fused]
 
def _rerank(
    query: str,
    candidates: List[Dict[str, Any]],
    top_n: int = RERANK_TOP_N,
) -> List[Dict[str, Any]]:
    """
    Score each (query, chunk) pair with a cross-encoder and return top_n.
    Cross-encoders are far more accurate than bi-encoders for relevance
    but too slow to run on the full corpus — hence the two-stage approach.
    """
    if not candidates:
        return []
 
    reranker = get_reranker()
    pairs = [(query, c["payload"]["text"]) for c in candidates]
    scores = reranker.predict(pairs).tolist()
 
    for candidate, score in zip(candidates, scores):
        candidate["rerank_score"] = score
 
    candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
    return candidates[:top_n]
 
def _build_context_block(chunks: List[Dict[str, Any]]) -> str:
    """
    Format retrieved chunks into a numbered citation block for the prompt.
    """
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        filename = chunk["payload"].get("filename", "unknown")
        chunk_idx = chunk["payload"].get("chunk_index", "?")
        text = chunk["payload"].get("text", "")
        parts.append(f"[{i}] Source: {filename} (chunk {chunk_idx})\n{text}")
    return "\n\n---\n\n".join(parts)


def retrieve_chunks(query: str, collection_name: str, limit: int = 5):
    """Retrieve relevant chunks from user's collection"""
    ensure_collection(collection_name)
    
    query_vector = embed_query(query)

    results = qdrant.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=limit
    )
    return [point.payload["text"] for point in results.points]

def generate_answer(query: str, chunks: list[str]):
    """Generate answer using Groq"""
    context = "\n\n".join(chunks)

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "Answer strictly using the provided context."
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion:\n{query}"
            }
        ],
        temperature=0.5,
        max_tokens=1024
    )
    return response.choices[0].message.content

def run_rag(query: str, collection_name: str):

    """Run the RAG pipeline for a specific user's documents"""

    chunks = retrieve_chunks(query, collection_name=collection_name)
    if not chunks:

        return "I couldn't find any relevant information in your uploaded documents. Please make sure you've uploaded documents first."
    
    return generate_answer(query, chunks)