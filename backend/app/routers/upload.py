from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
from app.services.docling_service import extract_text
from app.services.embedder import embed_document, store_vectors
from typing import List



router = APIRouter()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadResponse(BaseModel):
    filename: str
    status: str

@router.post("/upload", response_model=UploadResponse)

async def upload_files(files: List[UploadFile] = File(...)):

    try:
        print(f"Received files: {files.filename}")
        print(f"Content type: {files.content_type}")
        
        if not files:
            raise HTTPException(status_code=400, detail="No file uploaded")

        # 1. Save file to disk
        file_path = os.path.join(UPLOAD_DIR, files.filename)
        with open(file_path, "wb") as f:
            f.write(await files.read())
        
        print(f"File saved to: {file_path}")

        # 2. Extract text with Docling
        extracted_text = extract_text(file_path)
        print(f"Extracted text length: {len(extracted_text)}")
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the document")
        
        # 3. Chunk + embed
        vectors = embed_document(extracted_text)
        print(f"Generated {len(vectors)} vectors")

        # 4. Store embeddings in Qdrant
        store_vectors(vectors)
        print("Vectors stored successfully")

        return {"filename": files.filename, "status": "processed"}
    
    except Exception as e:
        print(f"Error in upload_file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))