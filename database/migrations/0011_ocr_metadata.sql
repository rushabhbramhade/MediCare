-- 0011_ocr_metadata.sql
--
-- OCR processing metadata for medical documents.
-- Tracks extraction status, results, and page-level details.

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.document_extractions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id      uuid NOT NULL,
  patient_id       uuid NOT NULL REFERENCES app.users (id) ON DELETE CASCADE,
  processing_status text NOT NULL DEFAULT 'PENDING'
                     CHECK (processing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED')),
  ocr_provider     text NOT NULL DEFAULT 'tesseract',
  detected_languages text NOT NULL DEFAULT 'eng,hin,mar',
  page_count       integer NOT NULL DEFAULT 0,
  confidence_summary double precision,
  processing_error  text,
  review_required   boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.document_extractions IS
  'OCR processing metadata for medical documents. Extracted text is stored separately in private storage.';

CREATE INDEX document_extractions_document_idx
  ON app.document_extractions (document_id);
CREATE INDEX document_extractions_patient_idx
  ON app.document_extractions (patient_id);
CREATE INDEX document_extractions_status_idx
  ON app.document_extractions (processing_status);

-- Default-deny RLS: only the API's connection (table owner) can access.
ALTER TABLE app.document_extractions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_extractions_set_updated_at
  BEFORE UPDATE ON app.document_extractions
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
