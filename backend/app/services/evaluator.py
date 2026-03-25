"""
RAGAS serves as the evaluation module for the RAG architecture
Metrics Computed:
Faithfulness 
Answer Relevancy 
Context Precision
"""

from typing import List, Optional, Dict, Any
from datasets import Dataset
from ragas import evaluate 
from ragas.metrics.collections import Faithfulness, AnswerRelevancy, ContextPrecision, ContextRecall
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.config import settings 

def _get_ragas_llm()->ChatGroq:
    """
    RAGAS uses LLM as judge internally to judge answers.
    """
    return ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile",
    temperature=0.0,
)

def _get_ragas_embeddings() -> HuggingFaceEmbeddings:
    """
    RAGAS uses embeddings internally for answer_relevancy scoring.
    """
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def evaluate_rag_response(
    query: str,
    answer: str,
    contexts: List[str],
    ground_truth: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Run RAGAS evaluation on a single RAG response.
    """
    
    data: Dict[str, List] = {
        "question":  [query],
        "answer":    [answer],
        "contexts":  [contexts],
    }
    metrics = [Faithfulness, AnswerRelevancy, ContextPrecision ]
 
    if ground_truth:
        data["ground_truth"] = [ground_truth]
        metrics.append(ContextRecall)
 
    dataset = Dataset.from_dict(data)
 
    llm        = _get_ragas_llm()
    embeddings = _get_ragas_embeddings()
    result = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=llm,
        embeddings=embeddings,
        raise_exceptions=False,
    )

      


