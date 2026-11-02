# Medical records

**Status:** Deferred — foundation only

## Responsibility

Record metadata, document extraction results and controlled sharing. Binaries live in private object storage, not in Postgres.

## Data owned

- `app.medical_records`
- `app.record_documents`
- `app.document_extractions`
- `app.knowledge_chunks` (pgvector, consent-scoped)

## Planned HTTP surface

- `GET /v1/medical-records`
- `POST /v1/medical-records`
- `DELETE /v1/medical-records/:id`
- `POST /v1/medical-records/:id/share`

## Security and safety notes

Patient ownership on every query, private storage, signed URLs, audit logging, and no AI retrieval without active consent. Soft-delete with a retention window; never hard-delete on a client request alone.

## Next step

Design the record schema with clinical governance; implement upload + OCR via the document worker.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
