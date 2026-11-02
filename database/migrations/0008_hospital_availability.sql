-- 0008_hospital_availability.sql
--
-- Separate availability model for hospital resources (general beds, ICU beds,
-- oxygen, ventilators, ambulances). Availability is never inferred: missing
-- rows mean unknown, and stale rows are clearly labelled.

CREATE TYPE app.availability_status AS ENUM (
  'AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN', 'STALE'
);

CREATE TABLE app.hospital_availability (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       uuid NOT NULL REFERENCES app.hospitals (id) ON DELETE CASCADE,
  resource_type     text NOT NULL CHECK (
    resource_type IN ('general_bed', 'icu_bed', 'oxygen', 'ventilator', 'ambulance')
  ),
  status            app.availability_status NOT NULL DEFAULT 'UNKNOWN',
  quantity          integer CHECK (quantity >= 0),
  source            text NOT NULL CHECK (char_length(source) BETWEEN 1 AND 128),
  reported_at       timestamptz NOT NULL DEFAULT now(),
  verified_at       timestamptz,
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('verified', 'unverified', 'stale')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hospital_availability_hospital_resource_key
    UNIQUE (hospital_id, resource_type)
);

COMMENT ON TABLE app.hospital_availability IS
  'Per-resource availability snapshots. Unknown and stale values are displayed as such, never inferred.';
COMMENT ON COLUMN app.hospital_availability.status IS
  'AVAILABLE, LIMITED, FULL, UNKNOWN or STALE. UNKNOWN means no report exists; STALE means the report is past its freshness window.';
COMMENT ON COLUMN app.hospital_availability.quantity IS
  'Reported quantity where available. NULL means the quantity was not reported.';
COMMENT ON COLUMN app.hospital_availability.source IS
  'Who reported this availability (e.g. hospital administration, health department).';

CREATE INDEX hospital_availability_hospital_idx ON app.hospital_availability (hospital_id);
CREATE INDEX hospital_availability_status_idx ON app.hospital_availability (status, reported_at DESC);

CREATE TRIGGER hospital_availability_set_updated_at
  BEFORE UPDATE ON app.hospital_availability
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE app.hospital_availability ENABLE ROW LEVEL SECURITY;
