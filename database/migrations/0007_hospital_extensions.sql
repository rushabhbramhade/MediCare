-- 0007_hospital_extensions.sql
--
-- Adds fields requested for the hospital discovery module without duplicating
-- Supabase Auth identity or inventing clinical availability. All new columns
-- are optional and clearly labelled as provider-supplied information.

ALTER TABLE app.hospitals
  ADD COLUMN phone text,
  ADD COLUMN hospital_type text CHECK (
    hospital_type IN (
      'government', 'private', 'charitable', 'multi_specialty', 'clinic', 'other'
    )
  ),
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN last_verified_at timestamptz;

ALTER TABLE app.hospitals
  ADD CONSTRAINT hospitals_phone_check
    CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$');

COMMENT ON COLUMN app.hospitals.phone IS
  'Verified contact phone in E.164 format. Populated only from a verified source.';
COMMENT ON COLUMN app.hospitals.hospital_type IS
  'Provider-declared hospital type. Not a clinical classification.';
COMMENT ON COLUMN app.hospitals.is_active IS
  'Whether the hospital is currently active. Inactive rows are excluded from search.';
COMMENT ON COLUMN app.hospitals.last_verified_at IS
  'When the provider last verified this record. NULL means unverified age.';

CREATE INDEX hospitals_is_active_idx ON app.hospitals (is_active) WHERE is_active IS TRUE;
CREATE INDEX hospitals_hospital_type_idx ON app.hospitals (hospital_type);
