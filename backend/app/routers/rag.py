from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.rag_pipeline import run_rag
from app.services.auth_service import get_current_active_user
from app.models.user import User
from app.database import get_db
import logging
from pydantic import BaseModel
from app.services.evaluator import evaluate_rag_response, evaluate_batch
from typing import Optional, List, Dict, Any

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Schemas for req and res

class QueryRequest(BaseModel):
    query: str
 
class SourceChunk(BaseModel):
    filename: str
    chunk_index: Optional[int] = None
    text: str
    rerank_score: float
 
class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    debug: dict
 
class EvaluateRequest(BaseModel):
    query: str
    answer: str
    contexts: List[str]
    ground_truth: Optional[str] = None 

class BatchEvaluateRequest:
     samples: List[EvaluateRequest]

@router.post("query", response_model=QueryResponse)
async def query_rag(
    payload: dict,
    request: QueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Query documents using RAG (PROTECTED - requires authentication)
    """
    try:
        query = payload["query"]
        logger.info(f"User {current_user.email} querying: {query}")
        
        collection_name = f"user_{current_user.id}_documents"
        answer = run_rag(query, collection_name=collection_name)
        logger.info(f"Generated answer for user {current_user.email}")
        
        current_user.queries_made += 1
        db.commit()
        logger.info(f"User {current_user.email} now has {current_user.queries_made} queries")
        
        return {"answer": answer}
    
    except KeyError:
        logger.error("Query field missing in payload")
        raise HTTPException(status_code=400, detail="Query field is required")
    
    except Exception as e:
        logger.error(f"Error in query_rag: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
    
@router.post("/api/evaluate")
async def evaluate_response(
    request: EvaluateRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Run RAGAS evaluation on a single query/answer/context triple.
 
    Use this endpoint to:
    - Score a response that was just generated
    - Audit historical responses
    - Compare pipeline versions
 
    Tip: pass ground_truth for context_recall scoring.
    """
    if not request.contexts:
        raise HTTPException(
            status_code=400,
            detail="At least one context string is required for evaluation."
        )
 
    result = evaluate_rag_response(
        query=request.query,
        answer=request.answer,
        contexts=request.contexts,
        ground_truth=request.ground_truth,
    )
    return result
 
 
@router.post("/api/evaluate/batch")
async def evaluate_batch_endpoint(
    request: BatchEvaluateRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Evaluate multiple query/answer pairs in one call.
    Returns per-sample scores and aggregated means.
    Useful for offline benchmarking of the full pipeline.
    """
    if not request.samples:
        raise HTTPException(status_code=400, detail="samples list cannot be empty.")
 
    samples = [s.dict() for s in request.samples]
    return evaluate_batch(samples)