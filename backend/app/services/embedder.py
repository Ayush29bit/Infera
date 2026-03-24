import uuid
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
from app.config import settings 
import re 

_embedder = None
def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder

COLLECTION_NAME = "documents"
CHUNK_SIZE = 400
CHUNK_OVERLAP = 50

def _split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences
    """
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n(#{1,6} )", r". \1", text)
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z\"\'])", text)
 
    result = []
    for sent in sentences:
        parts = re.split(r"\n{2,}", sent.strip())
        result.extend(p.strip() for p in parts if p.strip())
 
    return result if result else [text.strip()]

def _build_chunks(sentences: List[str]) -> List[str]:
    """
    Each chunk overlaps with the previous one by CHUNK_OVERLAP words.
    """
    chunks = []
    current_words: List[str] = []
    current_sentences: List[str] = []
 
    for sentence in sentences:
        words = sentence.split()
 
        if len(current_words) + len(words) > CHUNK_SIZE and current_words:
            chunks.append(" ".join(current_words))
 
            overlap_words = current_words[-CHUNK_OVERLAP:]
            current_words = overlap_words + words
            current_sentences = [sentence]
        else:
            current_words.extend(words)
            current_sentences.append(sentence)

    if current_words:
        chunks.append(" ".join(current_words))
 
    return chunks

def _compute_bm25_tf(text: str) -> Dict[str, float]:
    """
    Compute term frequency for BM25 ranking.
    (only for words with 2+ letters, ignoring case)
    No separate index store needed.
    """
    words = re.findall(r"\b[a-z]{2,}\b", text.lower())
    if not words:
        return {}
    tf: Dict[str, float] = {}
    for w in words:
        tf[w] = tf.get(w, 0) + 1
    total = len(words)
    return {w: round(count / total, 6) for w, count in tf.items()}
 

def embed_document(text: str, document_id: str, filename: str)-> List[Dict[str, Any]]:
    """
    chunk a document, embed each chunk, compute BM25 TF,
    and return a list of Qdrant-ready point dicts.

    Each point has:
    id: unique UUID string
    embedding: list of floats
    payload: dict with document_id, filename,
          chunk_index, text, and bm25

    """
    CHUNK_SIZE = 300
    words = text.split()
    chunks = []
    current = []
    chunk_index = 0

    for word in words:
        current.append(word)
        if len(current) >= CHUNK_SIZE:
            chunk_text = " ".join(current)
            chunks.append({
                "id": str(uuid.uuid4()),
                "embedding": get_embedder().encode(chunk_text).tolist(),
                "payload": {
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": chunk_index,
                    "text": chunk_text
                }
            })
            chunk_index += 1
            current = []

    if current:
        chunk_text = " ".join(current)
        chunks.append({
            "id": str(uuid.uuid4()),
            "embedding": get_embedder().encode(chunk_text).tolist(),
            "payload": {
                "document_id": document_id,
                "filename": filename,
                "chunk_index": chunk_index,
                "text": chunk_text
            }
        })

    return chunks

def embed_query(query: str) -> list[float]:
    """
    Embed a user query into the same vector space as documents.
    """
    return get_embedder().encode(query).tolist()
