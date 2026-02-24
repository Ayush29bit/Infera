from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
from app.services.docling_service import extract_text
from app.services.embedder import store_vectors
from app.services.embedder import embed_document
from app.services.auth_service import get_current_active_user
from app.models.user import User
from app.database import get_db

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadResponse(BaseModel):
    filename: str
    status: str
    message: str

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),  # PROTECTED NOW!
    db: Session = Depends(get_db)
):
    """
    Upload and process a document (PROTECTED - requires authentication)
    """
    try:
        print(f"User {current_user.email} uploading: {file.filename}")
        
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")

        # Save file to disk (user-specific folder)
        user_folder = os.path.join(UPLOAD_DIR, f"user_{current_user.id}")
        os.makedirs(user_folder, exist_ok=True)
        
        file_path = os.path.join(user_folder, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        print(f"File saved to: {file_path}")

        # Extract text with Docling
        extracted_text = extract_text(file_path)
        print(f"Extracted text length: {len(extracted_text)}")
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the document")

        # Chunk + embed
        vectors = embed_document(extracted_text)
        print(f"Generated {len(vectors)} vectors")

        # Store embeddings in USER-SPECIFIC Qdrant collection
        collection_name = f"user_{current_user.id}_documents"
        store_vectors(vectors, collection_name=collection_name)
        print(f"Vectors stored in collection: {collection_name}")
        
        # Update user's document count
        current_user.documents_uploaded += 1
        db.commit()
        print(f"User {current_user.email} now has {current_user.documents_uploaded} documents")

        return {
            "filename": file.filename,
            "status": "processed",
            "message": f"Document uploaded successfully! You now have {current_user.documents_uploaded} documents."
        }
    
    except Exception as e:
        print(f"Error in upload_file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))