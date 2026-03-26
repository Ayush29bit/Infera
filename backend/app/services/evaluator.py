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
 
    llm = _get_ragas_llm()
    embeddings = _get_ragas_embeddings()
    result = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=llm,
        embeddings=embeddings,
        raise_exceptions=False,
    )
    result_df = result.to_pandas()
    row = result_df.iloc[0]
 
    def safe(col: str) -> Optional[float]:
        val = row.get(col)
        if val is None:
            return None
        try:
            f = float(val)
            return None if (f != f) else round(f, 4)
        except (TypeError, ValueError):
            return None
 
    scores = {
        "faithfulness":safe("faithfulness"),
        "answer_relevancy":safe("answer_relevancy"),
        "context_precision":safe("context_precision"),
        "context_recall":safe("context_recall") if ground_truth else None,
    }

    THRESHOLD = 0.7
    available = [v for v in scores.values() if v is not None]
    passed = all(v >= THRESHOLD for v in available) if available else False
    summary = _build_summary(scores, passed, THRESHOLD)
 
    return {
        "scores": scores,
        "summary": summary,
        "passed": passed,
    }
 
def _build_summary(
    scores: Dict[str, Optional[float]],
    passed: bool,
    threshold: float,
) -> str:
    lines = ["RAGAS Evaluation Report", "=" * 30]
    labels = {
        "faithfulness":"Faithfulness(answer grounded in context?)",
        "answer_relevancy":"Answer Relevancy(answer addresses question?)",
        "context_precision":"Context Precision(retrieved chunks relevant?)",
        "context_recall":"Context Recall(all needed info retrieved?)",
    }
    for key, label in labels.items():
        val = scores.get(key)
        if val is None:
            lines.append(f"  {label}: N/A")
        else:
            flag = "✓" if val >= threshold else "✗"
            lines.append(f"  {flag} {label}: {val:.4f}")
 
    lines.append("-" * 30)
    lines.append(f"  Overall: {'PASSED' if passed else 'NEEDS IMPROVEMENT'} (threshold={threshold})")
    return "\n".join(lines)
 
def evaluate_batch(
    samples: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluate a batch of RAG samples and return aggregated scores.
    """
    per_sample = []
    for s in samples:
        r = evaluate_rag_response(
            query=s["query"],
            answer=s["answer"],
            contexts=s["contexts"],
            ground_truth=s.get("ground_truth"),
        )
        per_sample.append(r)
 
    metrics = ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]
    aggregate = {}
    for m in metrics:
        vals = [s["scores"][m] for s in per_sample if s["scores"].get(m) is not None]
        aggregate[m] = round(sum(vals) / len(vals), 4) if vals else None
        
    return {"per_sample": per_sample, "aggregate": aggregate}
 

      


