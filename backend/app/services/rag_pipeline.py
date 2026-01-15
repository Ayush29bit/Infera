from typing import List, Optional

from qdrant_client.http import models
from groq import Groq

from app.services.embedder import (
    qdrant,
    COLLECTION_NAME,
    embed_query,
    ensure_collection,
)


import os
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


ensure_collection()


def retrieve_chunks(
    query: str,
    limit: int = 5,
    document_ids: Optional[List[str]] = None,
):
    """
    Retrieve relevant chunks from Qdrant.
    Supports optional filtering by document_id(s).
    """

    query_vector = embed_query(query)

    query_filter = None
    if document_ids:
        query_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="document_id",
                    match=models.MatchAny(any=document_ids),
                )
            ]
        )

    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=limit,
        query_filter=query_filter,
    )

    return [
        {
            "text": point.payload["text"],
            "filename": point.payload["filename"],
            "document_id": point.payload["document_id"],
            "chunk_index": point.payload["chunk_index"],
        }
        for point in results
    ]


def generate_answer(query: str, chunks: List[dict]) -> str:
    """
    Generate a grounded answer using retrieved chunks.
    """

    if not chunks:
        return "I could not find relevant information in the provided documents."

    context = "\n\n".join(
        f"[Source: {chunk['filename']} | Chunk {chunk['chunk_index']}]\n{chunk['text']}"
        for chunk in chunks
    )

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a document-based assistant. "
                    "Answer strictly using the provided context. "
                    "If the answer is not contained in the context, say so."
                ),
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion:\n{query}",
            },
        ],
        temperature=0.2,
        max_tokens=1024,
    )

    return response.choices[0].message.content.strip()


def run_rag(
    query: str,
    document_ids: Optional[List[str]] = None,
    limit: int = 5,
) -> str:
    """
    Full RAG pipeline:
    query → retrieve → generate answer
    """

    chunks = retrieve_chunks(
        query=query,
        limit=limit,
        document_ids=document_ids,
    )

    return generate_answer(query, chunks)

