import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

"""
Document extraction service for Infera.
 
Strategy (in order):
  1. IBM Docling  — layout-aware OCR, handles structured + scanned PDFs
  2. EasyOCR      — fallback for documents Docling fails on
  3. Hard error   — if both fail, raise so the caller gets a clear message
 
Docling is always tried first because it preserves document structure
(headings, tables, sections) which dramatically improves chunking quality.
EasyOCR is a pure-OCR fallback — it extracts text but loses structure.
"""

try:
    from docling.document_converter import DocumentConverter
except ImportError:  # pragma: no cover - runtime compatibility fallback
    DocumentConverter = None


def _extract_with_docling(file_path: str) -> str:
    """
    Primary extraction using IBM docling.
    Preserves document structure.
    Extract text from any document using Docling.
    """
    logger.info(f"[docling] Processing: {file_path}")
    if DocumentConverter is None:
        raise RuntimeError("Docling is not installed in the current environment")

    try:
        print(f"Processing with Docling: {file_path}")
        
        # Instantiate the converter
        converter = DocumentConverter()
        
        # Convert the document
        result = converter.convert(file_path)
        
        # Export to markdown to preserve the structure
        markdown_text = result.document.export_to_markdown()
        
        print(f"Docling extraction successful: {len(markdown_text)} characters")
        logger.info(f"[docling] Extracted {len(markdown_text)} characters")
        
        return markdown_text
    
    except Exception as e:
        print(f"Error extracting text with Docling: {str(e)}")
        raise e
    

# EasyOCR fallback 
def _extract_with_easyocr(file_path: str) -> str:
    """
    Fallback extraction using EasyOCR.
    Works on image-based PDFs and scanned documents.
    """
    import easyocr
    import numpy as np
 
    logger.info(f"[easyocr] Fallback extraction: {file_path}")
 
    ext = Path(file_path).suffix.lower()
 
    # For image files
    if ext in {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}:
        reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        results = reader.readtext(file_path, detail=0, paragraph=True)
        text = "\n".join(results)
 
    # For PDFs
    elif ext == ".pdf":
        try:
            import fitz 
        except ImportError:
            raise ImportError(
                "PyMuPDF (fitz) is required for PDF rasterisation in EasyOCR fallback. "
                "Install with: pip install pymupdf"
            )
 
        reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        doc = fitz.open(file_path)
        page_texts = []
 
        for page_num, page in enumerate(doc):
            logger.info(f"[easyocr] Processing page {page_num + 1}/{len(doc)}")
            # Render page at 2x resolution for better OCR accuracy
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                pix.height, pix.width, pix.n
            )
            results = reader.readtext(img_array, detail=0, paragraph=True)
            page_texts.append(f"\n\n## Page {page_num + 1}\n\n" + "\n".join(results))
 
        doc.close()
        text = "\n".join(page_texts)
 
    else:
        raise ValueError(f"EasyOCR fallback does not support file type: {ext}")
 
    if not text or not text.strip():
        raise ValueError("EasyOCR returned empty text")
 
    logger.info(f"[easyocr] Extracted {len(text)} characters")
    return text

def extract_text(file_path: str) -> str:
    """
    Extract text from any supported document.
 
    Tries Docling first (structure-aware), falls back to EasyOCR (pure OCR).
    Raises RuntimeError if both methods fail, with both error messages included.
 
    Supported formats:
      Docling:  PDF, DOCX, PPTX, HTML, Markdown, Images
      EasyOCR:  PDF (rasterised), JPEG, PNG, BMP, TIFF
    """
    docling_error: Optional[Exception] = None
 
    # Stage 1: Docling
    try:
        return _extract_with_docling(file_path)
    except Exception as e:
        docling_error = e
        logger.warning(
            f"[docling] Failed on '{file_path}': {e}. "
            f"Attempting EasyOCR fallback..."
        )
 
    # Stage 2: EasyOCR 
    try:
        text = _extract_with_easyocr(file_path)
        logger.info(
            f"[easyocr] Fallback succeeded for '{file_path}'"
        )
        return text
    except Exception as easyocr_error:
        logger.error(
            f"[easyocr] Also failed on '{file_path}': {easyocr_error}"
        )
 
    # Stage3 : Both failed — raise with full context
    raise RuntimeError(
        f"All extraction methods failed for '{Path(file_path).name}'.\n"
        f"  Docling error:  {docling_error}\n"
        f"  EasyOCR error:  {easyocr_error}\n"
        f"Please ensure the file is a valid, non-corrupted document."
    )
 
def get_supported_extensions() -> set:
    """Return the set of file extensions supported by the extraction pipeline."""
    return {
        ".pdf", ".docx", ".doc", ".pptx", ".ppt",
        ".html", ".htm", ".md", ".txt",
        ".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"
    }
 