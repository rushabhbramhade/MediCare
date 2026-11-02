# Files

**Status:** Deferred — foundation only

## Responsibility

Validates uploads, issues short-lived signed URLs and manages private object storage.

## Data owned

- Object keys under the private `medical-records` bucket
- `app.file_objects` metadata (future)

## Planned HTTP surface

- `POST /v1/files/upload-intent`
- `POST /v1/files/:id/download-url`

## Security and safety notes

Buckets are private. The service-role key stays server-side. Validate MIME type and size with `medicalRecordUploadSchema`, scope object paths by patient id, issue minute-scale signed URLs and audit every access. Malware scanning is required before enabling public upload.

## Next step

Configure hosted Supabase Storage, then implement upload intents and document-worker scanning.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
