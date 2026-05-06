"""
RAGAS serves as the evaluation module for the RAG architecture
Metrics Computed:
Faithfulness 
Answer Relevancy 
Context Precision

Retrieval (deterministic):
Recall@K           : Fraction of relevant chunks found in top-K results
MRR                : Mean Reciprocal Rank — how high is the first
                       relevant chunk ranked?

"""

import math 
import logging
from typing import List, Optional, Dict, Any
from datasets import Dataset
from ragas import evaluate 
from ragas.metrics.collections import Faithfulness, AnswerRelevancy, ContextPrecision, ContextRecall
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.config import settings 

logger = logging.getLogger(__name__)

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

def _is_relevant(chunk_text: str, ground_truth_chunks: List[str]) -> bool:
    """
    A retrieved chunk is considered relevant if it contains (or is contained
    by) any of the ground truth reference strings. Case-insensitive substring
    match is used so exact wording isn't required.
    """
    chunk_lower = chunk_text.lower().strip()
    for gt in ground_truth_chunks:
        gt_lower = gt.lower().strip()
        if gt_lower in chunk_lower or chunk_lower in gt_lower:
            return True
    return False

def compute_recall_at_k(
    retrieved_chunks: List[str],
    ground_truth_chunks: List[str],
    k: int = 5,
) -> Dict[str, float]:
    """
    Recall@K = (# relevant chunks in top-K) / (# total relevant chunks)
 
    Returns scores for K = 1, 3, 5 (or up to len(retrieved_chunks)).

    Args:
        retrieved_chunks:    Ordered list of retrieved chunk texts (best first)
        ground_truth_chunks: List of texts that should have been retrieved
        k:                   Maximum K to evaluate up to

    Returns:
        {"recall@1": float, "recall@3": float, "recall@k": float}
    """
    if not ground_truth_chunks:
        return {"recall@1": None, "recall@3": None, f"recall@{k}": None}
 
    total_relevant = len(ground_truth_chunks)
    results = {}
 
    for ki in [1, 3, k]:
        top = retrieved_chunks[:ki]
        hits = sum(1 for chunk in top if _is_relevant(chunk, ground_truth_chunks))
        results[f"recall@{ki}"] = round(hits / total_relevant, 4)
 
    return results
 
def compute_mrr(
    retrieved_chunks: List[str],
    ground_truth_chunks: List[str],
) -> float:
    """
    Mean Reciprocal Rank (MRR) — for a single query this is just
    Reciprocal Rank: 1 / rank_of_first_relevant_chunk.
 
    If no relevant chunk is found in the retrieved list, returns 0.0.
 
    Args:
        retrieved_chunks:    Ordered list of retrieved chunk texts (best first)
        ground_truth_chunks: List of texts that should have been retrieved
 
    Returns:
        float between 0.0 and 1.0
        - 1.0  → first result was relevant
        - 0.5  → second result was first relevant
        - 0.33 → third result was first relevant
        - 0.0  → no relevant result found
    """
    for rank, chunk in enumerate(retrieved_chunks, start=1):
        if _is_relevant(chunk, ground_truth_chunks):
            return round(1.0 / rank, 4)
    return 0.0

def _run_ragas(
    query: str,
    answer: str,
    contexts: List[str],
    ground_truth: Optional[str],
) -> Dict[str, Optional[float]]:
    """Run RAGAS metrics and return score dict."""
    data: Dict[str, List] = {
        "question": [query],
        "answer":   [answer],
        "contexts": [contexts],
    }
    metrics = [Faithfulness, AnswerRelevancy, ContextPrecision]
 
    if ground_truth:
        data["ground_truth"] = [ground_truth]
        metrics.append(ContextRecall)
 
    dataset = Dataset.from_dict(data)
    result  = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=_get_ragas_llm(),
        embeddings=_get_ragas_embeddings(),
        raise_exceptions=False,
    )
 
    row = result.to_pandas().iloc[0]
 
    def _safe(col: str) -> Optional[float]:
        val = row.get(col)
        if val is None:
            return None
        try:
            f = float(val)
            return None if f != f else round(f, 4)  # NaN check
        except (TypeError, ValueError):
            return None
 
    return {
        "faithfulness":      _safe("faithfulness"),
        "answer_relevancy":  _safe("answer_relevancy"),
        "context_precision": _safe("context_precision"),
        "context_recall":    _safe("context_recall") if ground_truth else None,
    }
 
def evaluate_rag_response(
    query: str,
    answer: str,
    contexts: List[str],
    ground_truth: Optional[str] = None,
    ground_truth_chunks: Optional[List[str]] = None,
    k: int = 5,
) -> Dict[str, Any]:
    """
    Full evaluation of a single RAG response.
 
    Args:
        query:               The user's question
        answer:              The LLM-generated answer
        contexts:            Retrieved chunk texts passed to the LLM
        ground_truth:        Reference answer (enables RAGAS context_recall)
        ground_truth_chunks: Known-relevant chunk texts (enables Recall@K, MRR)
        k:                   K value for Recall@K (default 5)
    Returns:
        {
          "ragas_scores":      { faithfulness, answer_relevancy, ... },
          "retrieval_scores":  { recall@1, recall@3, recall@k, mrr },
          "summary":           str,
          "passed":            bool,
        }
    """
    ragas_scores = _run_ragas(query, answer, contexts, ground_truth)
 
    # Retrieval scores (deterministic)
    if ground_truth_chunks:
        recall_scores = compute_recall_at_k(contexts, ground_truth_chunks, k=k)
        mrr_score     = compute_mrr(contexts, ground_truth_chunks)
    else:
        recall_scores = {f"recall@{ki}": None for ki in [1, 3, k]}
        mrr_score     = None
 
    retrieval_scores = {**recall_scores, "mrr": mrr_score}
 
    # Overall pass/fail at threshold 0.7
    THRESHOLD = 0.7
    all_scores = list(ragas_scores.values()) + list(retrieval_scores.values())
    available  = [v for v in all_scores if v is not None]
    passed     = all(v >= THRESHOLD for v in available) if available else False
 
    summary = _build_summary(ragas_scores, retrieval_scores, passed, THRESHOLD, k)
 
    return {
        "ragas_scores":     ragas_scores,
        "retrieval_scores": retrieval_scores,
        "summary":          summary,
        "passed":           passed,
    }

def _build_summary(
    scores: Dict,
    retrieval: Dict,
    passed: bool,
    threshold: float,
    k: int,
) -> str:
    lines = ["RAGAS Evaluation Report", "=" * 34]
    lines.append("  RAGAS Metrics (LLM-judged):")
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

    lines.append("  Retrieval Metrics (deterministic):")
    for ki in [1, 3, k]:
        val = retrieval.get(f"recall@{ki}")
        if val is None:
            lines.append(f"    Recall@{ki}: N/A (no ground_truth_chunks provided)")
        else:
            flag = "✓" if val >= threshold else "✗"
            lines.append(f"    {flag} Recall@{ki}: {val:.4f}")
 
    mrr = retrieval.get("mrr")
    if mrr is None:
        lines.append("  MRR: N/A (no ground_truth_chunks provided)")
    else:
        flag = "✓" if mrr >= threshold else "✗"
        lines.append(f"    {flag} MRR: {mrr:.4f}")
 
    lines.append("-" * 34)
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
            ground_truth_chunks=s.get("ground_truth_chunks"),
        )
        per_sample.append(r)
 
    ragas_keys     = ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]
    retrieval_keys = ["recall@1", "recall@3", "recall@5", "mrr"]
    aggregate = {}
 
    for key in ragas_keys:
        vals = [s["ragas_scores"].get(key) for s in per_sample if s["ragas_scores"].get(key) is not None]
        aggregate[key] = round(sum(vals) / len(vals), 4) if vals else None
 
    for key in retrieval_keys:
        vals = [s["retrieval_scores"].get(key) for s in per_sample if s["retrieval_scores"].get(key) is not None]
        aggregate[key] = round(sum(vals) / len(vals), 4) if vals else None
 
        
    return {"per_sample": per_sample, "aggregate": aggregate}
 

      


