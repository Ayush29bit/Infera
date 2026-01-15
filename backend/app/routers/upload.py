from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import os
import uuid

from app.services.docling_service import extract_text
from app.services.embedder import embed_document, store_vectors

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UploadResponse(BaseModel):
    filename: str
    document_id: str
    status: str


@router.post("/upload", response_model=List[UploadResponse])
async def upload_files(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    responses = []

    for file in files:
        try:
            print(f"Received file: {file.filename}")
            print(f"Content type: {file.content_type}")

            document_id = str(uuid.uuid4())

            # 1. Save file
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())

            print(f"File saved to: {file_path}")

            # 2. Extract text
            extracted_text = extract_text(file_path)
            print(f"Extracted text length: {len(extracted_text)}")

            if not extracted_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail=f"No text extracted from {file.filename}"
                )

            # 3. Chunk + embed
            vectors = embed_document(
                extracted_text,
                document_id=document_id,
                filename=file.filename
            )
            print(f"Generated {len(vectors)} vectors")

            # 4. Store in Qdrant
            store_vectors(vectors)
            print("Vectors stored successfully")

            responses.append(
                UploadResponse(
                    filename=file.filename,
                    document_id=document_id,
                    status="processed"
                )
            )

        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            responses.append(
                UploadResponse(
                    filename=file.filename,
                    document_id="",
                    status=f"failed: {str(e)}"
                )
            )

    return responses
