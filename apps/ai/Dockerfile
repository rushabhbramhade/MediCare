FROM ghcr.io/astral-sh/uv:0.12.2 AS uv

FROM python:3.12-slim

# System dependencies for Tesseract OCR (local, no paid API key).
# tesseract-ocr: the OCR engine.
# tesseract-ocr-eng / hin / mar: trained language data for English, Hindi, Marathi.
# poppler-utils: pdf2image backend for converting PDF pages to images.
# libgl1: required by OpenCV/Pillow image preprocessing.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    tesseract-ocr-mar \
    poppler-utils \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=uv /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app

RUN useradd --create-home --uid 10001 medicare && chown -R medicare:medicare /app
USER medicare

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
