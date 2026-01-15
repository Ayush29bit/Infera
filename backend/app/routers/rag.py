from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.services.rag_pipeline import run_rag

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QueryRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None


class QueryResponse(BaseModel):
    answer: str


@router.post("/query", response_model=QueryResponse)
async def query_rag(payload: QueryRequest):
    try:
        logger.info(f"Received query: {payload.query}")
        logger.info(f"Document scope: {payload.document_ids}")

        answer = run_rag(
            query=payload.query,
            document_ids=payload.document_ids,
        )

        logger.info(f"Generated answer (preview): {answer[:100]}...")
        return {"answer": answer}

    except Exception as e:
        logger.error(f"Error in query_rag: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error processing query",
        )

