-- 0005_hospital_discovery.sql
--
-- Verified hospital directory records only. There is no bed/ICU availability
-- column: the product must return `unknown` until a licensed live source exists.
-- Rows enter this table through a provider sync, never through invented seeds.

CREATE TABLE app.hospitals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            text NOT NULL,
  external_id         text NOT NULL,
  name                text NOT NULL,
  address_line        text,
  city                text,
  state               text,
  postal_code         text,
  country_code        text NOT NULL DEFAULT 'IN',
  location            geography(Point, 4326) NOT NULL,
  has_emergency       boolean,
  specialties         text[] NOT NULL DEFAULT '{}',
  verification_status text NOT NULL DEFAULT 'unverified',
  last_synced_at      timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hospitals_provider_external_key UNIQUE (provider, external_id),
  CONSTRAINT hospitals_name_check CHECK (char_length(name) BETWEEN 1 AND 200),
  CONSTRAINT hospitals_provider_check CHECK (char_length(provider) BETWEEN 1 AND 64),
  CONSTRAINT hospitals_external_id_check CHECK (char_length(external_id) BETWEEN 1 AND 200),
  CONSTRAINT hospitals_country_code_check CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT hospitals_verification_status_check
    CHECK (verification_status IN ('unverified', 'verified', 'stale'))
);

COMMENT ON TABLE app.hospitals IS
  'Verified hospital directory rows from a named provider. No bed counts and no invented availability.';
COMMENT ON COLUMN app.hospitals.has_emergency IS
  'NULL means the provider did not verify emergency capability. Never assume false.';
COMMENT ON COLUMN app.hospitals.verification_status IS
  'Only verified or stale rows are searchable. unverified rows stay hidden until checked.';

CREATE INDEX hospitals_location_gix ON app.hospitals USING gist (location);
CREATE INDEX hospitals_specialties_gin ON app.hospitals USING gin (specialties);
CREATE INDEX hospitals_emergency_idx ON app.hospitals (has_emergency) WHERE has_emergency IS TRUE;
CREATE INDEX hospitals_verification_idx
  ON app.hospitals (verification_status, last_synced_at DESC);

CREATE TRIGGER hospitals_set_updated_at
  BEFORE UPDATE ON app.hospitals
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE app.hospitals ENABLE ROW LEVEL SECURITY;
