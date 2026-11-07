"""OCR API endpoints — internal service-to-service only.

All routes require the X-Internal-Token header and are never exposed
directly to the browser.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, Field

from app.core.security import require_internal_token
from app.core.config import get_settings
from app.ocr.service import (
    process_document,
    OCR_STATUS_PENDING,
    OCR_STATUS_PROCESSING,
    OCR_STATUS_COMPLETED,
    OCR_STATUS_FAILED,
    OCR_STATUS_REVIEW_REQUIRED,
)

router = APIRouter()

# In-memory job store (replaced by DB-backed storage in Phase 4).
_ocr_jobs: dict[str, dict] = {}


class OCRProcessRequest(BaseModel):
    document_id: str = Field(min_length=1, max_length=128)
    file_path: str = Field(min_length=1, max_length=1024)
    mime_type: str
    languages: str | None = Field(
        default=None,
        description="Comma-separated Tesseract language codes (e.g. eng,hin,mar).",
    )


class PageResultOut(BaseModel):
    page_number: int
    text: str
    confidence: float | None = None
    ocr_method: str
    is_uncertain: bool


class OCRProcessResponse(BaseModel):
    job_id: str
    status: str
    document_id: str
    provider: str
    message: str


class OCRStatusResponse(BaseModel):
    job_id: str
    status: str
    document_id: str
    provider: str | None = None
    languages: list[str] = Field(default_factory=list)
    page_count: int = 0
    pages: list[PageResultOut] = Field(default_factory=list)
    full_text: str | None = None
    confidence_summary: float | None = None
    processing_error: str | None = None
    review_required: bool = False


@router.post(
    "/ocr/process",
    response_model=OCRProcessResponse,
    tags=["ocr"],
)
async def process_ocr(
    request: OCRProcessRequest,
    _: Annotated[None, Depends(require_internal_token)],
) -> OCRProcessResponse:
    """Queue a document for local Tesseract OCR processing.

    The document is processed synchronously and the result is returned.
    For large documents, the caller should poll /v1/ocr/status/:job_id.
    """
    settings = get_settings()
    if not settings.ocr_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR is not configured. Set OCR_PROVIDER=tesseract.",
        )

    job_id = str(uuid.uuid4())
    _ocr_jobs[job_id] = {
        "status": OCR_STATUS_PROCESSING,
        "document_id": request.document_id,
        "provider": "tesseract",
    }

    file_path = Path(request.file_path)
    if not file_path.exists():
        _ocr_jobs[job_id]["status"] = OCR_STATUS_FAILED
        _ocr_jobs[job_id]["error"] = f"File not found: {request.file_path}"
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source document not found.",
        )

    languages = (
        [lang.strip() for lang in request.languages.split(",") if lang.strip()]
        if request.languages
        else None
    )

    try:
        result = process_document(file_path, request.document_id, request.mime_type, languages)
        _ocr_jobs[job_id] = {
            "status": result.status,
            "document_id": result.document_id,
            "provider": result.provider,
            "languages": result.languages,
            "page_count": result.page_count,
            "pages": [
                {
                    "page_number": p.page_number,
                    "text": p.text,
                    "confidence": p.confidence,
                    "ocr_method": p.ocr_method,
                    "is_uncertain": p.is_uncertain,
                }
                for p in result.pages
            ],
            "full_text": result.full_text,
            "confidence_summary": result.confidence_summary,
            "processing_error": result.processing_error,
            "review_required": result.review_required,
        }
        return OCRProcessResponse(
            job_id=job_id,
            status=result.status,
            document_id=result.document_id,
            provider=result.provider,
            message="OCR processing complete.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        _ocr_jobs[job_id] = {
            "status": OCR_STATUS_FAILED,
            "document_id": request.document_id,
            "provider": "tesseract",
            "error": str(exc),
        }
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OCR processing failed: {exc}",
        )


@router.get(
    "/ocr/status/{job_id}",
    response_model=OCRStatusResponse,
    tags=["ocr"],
)
async def get_ocr_status(
    job_id: str,
    _: Annotated[None, Depends(require_internal_token)],
) -> OCRStatusResponse:
    """Retrieve OCR processing status and results for a job."""
    job = _ocr_jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OCR job not found.",
        )

    return OCRStatusResponse(
        job_id=job_id,
        status=job["status"],
        document_id=job["document_id"],
        provider=job.get("provider"),
        languages=job.get("languages", []),
        page_count=job.get("page_count", 0),
        pages=job.get("pages", []),
        full_text=job.get("full_text"),
        confidence_summary=job.get("confidence_summary"),
        processing_error=job.get("processing_error"),
        review_required=job.get("review_required", False),
    )
