import uuid
from sentence_transformers import SentenceTransformer

_embedder = None
def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder

COLLECTION_NAME = "documents"

def embed_document(text: str, document_id: str, filename: str):
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
