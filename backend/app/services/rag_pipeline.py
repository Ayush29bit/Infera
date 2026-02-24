import os
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from groq import Groq
from dotenv import load_dotenv
from app.services.embedder import embed_document, embed_query

load_dotenv()

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
    timeout=120
)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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

def store_vectors(vectors):
    qdrant.upsert(
        collection_name="documents",
        points=[
            PointStruct(
                id=v["id"],
                vector=v["embedding"],
                payload=v["payload"]
            )
            for v in vectors
        ]
    )
    print(f"Stored {len(vectors)} vectors in Qdrant")

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