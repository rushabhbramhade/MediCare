# Document worker

**Status:** scaffolding — no OCR provider is integrated.

Consumes `document-processing` jobs from the BullMQ queue and, in this build, fails
each job with an explicit "no OCR provider adapter is configured" error. Jobs are marked
unrecoverable so they do not retry forever against a provider that does not exist.

## When it gains real behaviour

1. Add an OCR adapter behind an interface, with a disabled-by-default provider.
2. Store the extracted text and page references in `app.documents` / `app.document_pages`.
3. Delete the `UnrecoverableError` branch and hand the job to the adapter.

Never fabricate extracted text. A failed extraction must remain failed and visible to the
patient.

## Run

```bash
pnpm --filter @medicare/document-worker dev     # requires REDIS_URL
pnpm --filter @medicare/document-worker build
```

Required env: `REDIS_URL`, optional `QUEUE_PREFIX`, `LOG_LEVEL`, `DATABASE_URL`.
See `.env.example`.
