# iCare AI service

FastAPI + Pydantic. Internal only; the API calls it with `X-Internal-Token`. It is not a
medical device and must not be exposed directly to patients.

## Endpoints

| Method | Path                        | Auth           | Purpose                                     |
| ------ | --------------------------- | -------------- | ------------------------------------------- |
| GET    | `/v1/health`                | public         | liveness + whether a provider is configured |
| POST   | `/v1/icare/symptoms`        | internal token | symptom guidance request                    |
| POST   | `/v1/icare/reports/analyze` | internal token | plain-language report explanation           |
| POST   | `/v1/ocr/process`           | internal token | local Tesseract OCR text extraction         |
| GET    | `/v1/ocr/status/:job_id`    | internal token | OCR processing status and results           |

If `INTERNAL_SERVICE_TOKEN` is unset, iCare and OCR routes return 503. A wrong token returns 401.

## Run

```bash
uv python install 3.12     # once
uv sync --all-extras
uv run uvicorn app.main:app --reload --port 8000
uv run pytest
uv run ruff check .
```

Provider settings live in `app/core/config.py`. `AI_PROVIDER=disabled` (the default)
means non-emergency iCare requests fail with an honest unavailable error. Emergency
red-flag answers still work because they are deterministic and never call a provider.

OCR is independent of `AI_PROVIDER`. Set `OCR_PROVIDER=tesseract` to enable local
Tesseract OCR (no paid API key). Requires the `tesseract` executable and language
data (`eng`, `hin`, `mar`) to be installed on the host.

## Safety order

1. Deterministic red-flag check -> fixed escalation answer if matched.
2. Provider availability check.
3. Consent-gated retrieval (currently always empty; `patient_ref` only).
4. Redaction, prompt build, provider call.
5. Output validation (no diagnosis/dosing) -> safe fallback if rejected.
6. Disclaimer added.

See `docs/clinical-governance/safety-principles.md` before changing prompts, guards or
model settings. Prompt or output changes need safety tests and clinical review.

## Not implemented

No licensed knowledge corpus, no embeddings, no clinician review, no adverse-event
reporting, no rate limiting (the gateway should enforce it), no prompt/response logging
of patient content.
