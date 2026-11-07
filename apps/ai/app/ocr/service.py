"""Local Tesseract OCR service for medical documents.

No paid OCR API key is required. All processing happens locally via the
Tesseract OCR engine. Works independently of AI_PROVIDER.
"""

from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import cv2
import numpy as np
from pypdf import PdfReader
from pdf2image import convert_from_path
from PIL import Image, ImageOps, ImageEnhance
import pytesseract

from app.core.config import get_settings

logger = logging.getLogger("medicare.ai.ocr")

OCR_STATUS_PENDING = "PENDING"
OCR_STATUS_PROCESSING = "PROCESSING"
OCR_STATUS_COMPLETED = "COMPLETED"
OCR_STATUS_FAILED = "FAILED"
OCR_STATUS_REVIEW_REQUIRED = "REVIEW_REQUIRED"

SUPPORTED_IMAGE_MIMES = {"image/jpeg", "image/jpg", "image/png"}
SUPPORTED_PDF_MIME = "application/pdf"


class OCRNotConfiguredError(RuntimeError):
    """Raised when OCR is not configured (OCR_PROVIDER != tesseract)."""


class TesseractNotFoundError(RuntimeError):
    """Raised when the Tesseract executable is not available."""


class LanguageDataMissingError(RuntimeError):
    """Raised when a requested Tesseract language data pack is missing."""


class OCRTimeoutError(RuntimeError):
    """Raised when OCR processing exceeds the configured timeout."""


@dataclass
class PageResult:
    """OCR result for a single page."""

    page_number: int
    text: str
    confidence: float | None
    ocr_method: Literal["embedded", "tesseract"]
    is_uncertain: bool


@dataclass
class OCRResult:
    """Complete OCR result for a document."""

    document_id: str
    status: str
    provider: str
    languages: list[str]
    page_count: int
    pages: list[PageResult]
    full_text: str
    confidence_summary: float | None
    processing_error: str | None
    review_required: bool


def _tesseract_cmd() -> str:
    """Return the Tesseract executable path, checking availability."""
    cmd = os.environ.get("TESSERACT_CMD", "tesseract")
    try:
        subprocess.run(
            [cmd, "--version"],
            capture_output=True,
            check=True,
            timeout=5,
        )
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise TesseractNotFoundError(
            f"Tesseract executable '{cmd}' not found or not executable. "
            "Install Tesseract OCR (brew install tesseract on macOS, "
            "tesseract-ocr on Debian/Ubuntu)."
        ) from exc
    return cmd


def _verify_language_data(languages: list[str]) -> None:
    """Verify that requested Tesseract language data packs are installed."""
    cmd = _tesseract_cmd()
    try:
        result = subprocess.run(
            [cmd, "--list-langs"],
            capture_output=True,
            text=True,
            check=True,
            timeout=10,
        )
    except subprocess.TimeoutExpired as exc:
        raise OCRTimeoutError("Tesseract --list-langs timed out") from exc

    installed = set(line.strip() for line in result.stdout.splitlines()[1:])
    missing = [lang for lang in languages if lang not in installed]
    if missing:
        raise LanguageDataMissingError(
            f"Tesseract language data not installed: {', '.join(missing)}. "
            f"Installed: {', '.join(sorted(installed)) or 'none'}"
        )


def _preprocess_image(image: Image.Image) -> Image.Image:
    """Apply image preprocessing to improve OCR accuracy.

    - Convert to grayscale
    - Increase contrast
    - Reduce noise
    - Normalize resolution

    Does not modify the original image object.
    """
    # Work on a copy; never modify the caller's image.
    img = image.convert("L")

    # Resize if too small (Tesseract works best at 200-300 DPI equivalent).
    width, height = img.size
    if width < 1000 or height < 1000:
        scale = max(1000 / width, 1000 / height)
        new_size = (int(width * scale), int(height * scale))
        img = img.resize(new_size, Image.LANCZOS)

    # Improve contrast.
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)

    # Convert to OpenCV for noise reduction / deskew.
    cv_img = np.array(img)
    # Denoise.
    cv_img = cv2.fastNlMeansDenoising(cv_img, None, 10, 7, 21)

    # Deskew: estimate skew angle and rotate if needed.
    coords = np.column_stack(np.where(cv_img > 0))
    if len(coords) > 10:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) > 0.5:
            (h, w) = cv_img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            cv_img = cv2.warpAffine(
                cv_img, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )

    return Image.fromarray(cv_img)


def _ocr_image(image_path: Path, lang_arg: str) -> tuple[str, float | None]:
    """Run Tesseract OCR on a single image file.

    Returns (text, confidence). Confidence is the average word confidence
    from Tesseract's dict output, or None if unavailable.

    `lang_arg` is a Tesseract-compatible language string like "eng+hin+mar".
    """
    cmd = _tesseract_cmd()

    # Build Tesseract config for better accuracy on documents.
    config = "--oem 3 --psm 6"

    try:
        # Extract text with dict output for confidence data.
        data = pytesseract.image_to_data(
            Image.open(image_path),
            lang=lang_arg,
            config=config,
            output_type=pytesseract.Output.DICT,
            timeout=120,
        )
        text = pytesseract.image_to_string(
            Image.open(image_path),
            lang=lang_arg,
            config=config,
            timeout=120,
        )
    except RuntimeError as exc:
        if "timeout" in str(exc).lower():
            raise OCRTimeoutError(f"Tesseract OCR timed out for {image_path}") from exc
        raise

    # Compute average confidence from Tesseract dict output.
    confidences: list[float] = []
    for conf in data.get("conf", []):
        try:
            c = float(conf)
            if c > 0:
                confidences.append(c)
        except (ValueError, TypeError):
            continue

    avg_confidence = (sum(confidences) / len(confidences)) if confidences else None
    return text, avg_confidence


def _extract_embedded_pdf_text(pdf_path: Path) -> list[tuple[int, str]]:
    """Extract embedded (selectable) text from a PDF using pypdf.

    Returns a list of (page_number, text) tuples. Returns empty list if
    no extractable text is found (scanned PDF).
    """
    pages: list[tuple[int, str]] = []
    try:
        reader = PdfReader(str(pdf_path))
        for i, page in enumerate(reader.pages, start=1):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            if text.strip():
                pages.append((i, text))
    except Exception:
        # Corrupted or unreadable PDF — return empty, caller will try OCR.
        pass
    return pages


def _pdf_page_count(pdf_path: Path) -> int:
    """Return the number of pages in a PDF."""
    reader = PdfReader(str(pdf_path))
    return len(reader.pages)


def process_document(
    file_path: Path,
    document_id: str,
    mime_type: str,
    languages: list[str] | None = None,
) -> OCRResult:
    """Process a document through OCR.

    For PDFs: first tries embedded text extraction; falls back to per-page
    OCR for pages without useful embedded text (scanned pages).
    For images: runs Tesseract OCR with preprocessing.

    Never logs extracted text or patient information.
    """
    settings = get_settings()

    if not settings.ocr_configured:
        raise OCRNotConfiguredError(
            "OCR is not configured. Set OCR_PROVIDER=tesseract."
        )

    langs = languages or settings.ocr_language_list

    # Verify Tesseract and language data before doing any work.
    _tesseract_cmd()
    _verify_language_data(langs)

    lang_arg = "+".join(langs)

    # Enforce page count limit for PDFs.
    page_count = 0
    if mime_type == SUPPORTED_PDF_MIME:
        try:
            page_count = _pdf_page_count(file_path)
        except Exception:
            page_count = 0
        if page_count > settings.ocr_max_pages:
            return OCRResult(
                document_id=document_id,
                status=OCR_STATUS_FAILED,
                provider="tesseract",
                languages=langs,
                page_count=page_count,
                pages=[],
                full_text="",
                confidence_summary=None,
                processing_error=(
                    f"PDF has {page_count} pages, exceeding limit of "
                    f"{settings.ocr_max_pages} pages."
                ),
                review_required=False,
            )

    pages: list[PageResult] = []
    full_text_parts: list[str] = []
    all_confidences: list[float] = []
    review_required = False
    ocr_method = "tesseract"

    try:
        if mime_type == SUPPORTED_PDF_MIME:
            # Try embedded text extraction first.
            embedded_pages = _extract_embedded_pdf_text(file_path)
            embedded_page_numbers = {p for p, _ in embedded_pages}

            if embedded_pages:
                ocr_method = "embedded"
                for page_num, text in embedded_pages:
                    pages.append(
                        PageResult(
                            page_number=page_num,
                            text=text,
                            confidence=None,
                            ocr_method="embedded",
                            is_uncertain=False,
                        )
                    )
                    full_text_parts.append(f"--- Page {page_num} ---\n{text}")

            # Determine which pages need OCR (scanned pages without embedded text).
            all_page_numbers = set(range(1, page_count + 1)) if page_count > 0 else set()
            pages_needing_ocr = sorted(all_page_numbers - embedded_page_numbers)

            if pages_needing_ocr:
                # Convert only the pages needing OCR to images.
                images = convert_from_path(
                    str(file_path),
                    first_page=min(pages_needing_ocr),
                    last_page=max(pages_needing_ocr),
                    dpi=200,
                )
                # images is 0-indexed relative to first_page.
                for idx, image in enumerate(images):
                    page_num = min(pages_needing_ocr) + idx
                    if page_num not in pages_needing_ocr:
                        continue
                    tmp_path = None
                    tmp2_path = None
                    try:
                        with tempfile.NamedTemporaryFile(
                            suffix=".png", delete=False
                        ) as tmp:
                            tmp_path = Path(tmp.name)
                            image.save(tmp_path, format="PNG")

                        preprocessed = _preprocess_image(Image.open(tmp_path))
                        with tempfile.NamedTemporaryFile(
                            suffix=".png", delete=False
                        ) as tmp2:
                            tmp2_path = Path(tmp2.name)
                            preprocessed.save(tmp2_path, format="PNG")

                        text, confidence = _ocr_image(tmp2_path, lang_arg)
                    except Exception as exc:
                        logger.warning(
                            "ocr_page_failed",
                            page=page_num,
                            error=str(exc),
                        )
                        text = ""
                        confidence = None
                    finally:
                        if tmp2_path:
                            tmp2_path.unlink(missing_ok=True)
                        if tmp_path:
                            tmp_path.unlink(missing_ok=True)

                    is_uncertain = (
                        confidence is not None and confidence < 60
                    ) or not text.strip()
                    if is_uncertain:
                        review_required = True

                    pages.append(
                        PageResult(
                            page_number=page_num,
                            text=text,
                            confidence=confidence,
                            ocr_method="tesseract",
                            is_uncertain=is_uncertain,
                        )
                    )
                    full_text_parts.append(f"--- Page {page_num} ---\n{text}")
                    if confidence is not None:
                        all_confidences.append(confidence)

        elif mime_type in SUPPORTED_IMAGE_MIMES:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = Path(tmp.name)
                Image.open(file_path).save(tmp_path, format="PNG")
            try:
                preprocessed = _preprocess_image(Image.open(tmp_path))
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp2:
                    tmp2_path = Path(tmp2.name)
                    preprocessed.save(tmp2_path, format="PNG")
                try:
                    text, confidence = _ocr_image(tmp2_path, lang_arg)
                finally:
                    tmp2_path.unlink(missing_ok=True)
                tmp_path.unlink(missing_ok=True)
            except Exception:
                tmp_path.unlink(missing_ok=True)
                raise

            is_uncertain = (
                confidence is not None and confidence < 60
            ) or not text.strip()
            if is_uncertain:
                review_required = True

            pages.append(
                PageResult(
                    page_number=1,
                    text=text,
                    confidence=confidence,
                    ocr_method="tesseract",
                    is_uncertain=is_uncertain,
                )
            )
            full_text_parts.append(text)
            if confidence is not None:
                all_confidences.append(confidence)
            page_count = 1
        else:
            return OCRResult(
                document_id=document_id,
                status=OCR_STATUS_FAILED,
                provider="tesseract",
                languages=langs,
                page_count=0,
                pages=[],
                full_text="",
                confidence_summary=None,
                processing_error=f"Unsupported MIME type: {mime_type}",
                review_required=False,
            )

    except OCRTimeoutError:
        raise
    except (TesseractNotFoundError, LanguageDataMissingError):
        raise
    except Exception as exc:
        logger.warning("ocr_processing_error", exc_info=str(exc))
        return OCRResult(
            document_id=document_id,
            status=OCR_STATUS_FAILED,
            provider="tesseract",
            languages=langs,
            page_count=page_count,
            pages=pages,
            full_text="\n".join(full_text_parts),
            confidence_summary=None,
            processing_error=f"OCR processing failed: {exc}",
            review_required=False,
        )

    confidence_summary = (
        (sum(all_confidences) / len(all_confidences)) if all_confidences else None
    )

    return OCRResult(
        document_id=document_id,
        status=OCR_STATUS_COMPLETED,
        provider="tesseract",
        languages=langs,
        page_count=page_count,
        pages=pages,
        full_text="\n".join(full_text_parts),
        confidence_summary=confidence_summary,
        processing_error=None,
        review_required=review_required,
    )
