-- 0012_osm_discovery.sql
--
-- OSM-discovered facility records (hospitals, pharmacies).
-- These are OpenStreetMap features, never verified medical facilities.
-- Rows enter this table through an Overpass sync, never through invented seeds.
-- verification_status is always 'unverified' for OSM-sourced rows.

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.osm_discovered_facilities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          text NOT NULL DEFAULT 'openstreetmap',
  external_id       text NOT NULL,
  name              text,
  address_line      text,
  city              text,
  state             text,
  postal_code       text,
  country_code      text NOT NULL DEFAULT 'IN',
  location          geography(Point, 4326) NOT NULL,
  feature_type      text NOT NULL CHECK (feature_type IN ('hospital', 'pharmacy')),
  phone             text,
  verification_status text NOT NULL DEFAULT 'unverified',
  last_synced_at    timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT osm_discovered_provider_external_key UNIQUE (provider, external_id),
  CONSTRAINT osm_discovered_name_check CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 200),
  CONSTRAINT osm_discovered_provider_check CHECK (char_length(provider) BETWEEN 1 AND 64),
  CONSTRAINT osm_discovered_external_id_check CHECK (char_length(external_id) BETWEEN 1 AND 200),
  CONSTRAINT osm_discovered_country_code_check CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT osm_discovered_verification_status_check
    CHECK (verification_status IN ('unverified', 'verified', 'stale'))
);

COMMENT ON TABLE app.osm_discovered_facilities IS
  'OpenStreetMap-discovered facilities (hospitals, pharmacies). Always unverified.';
COMMENT ON COLUMN app.osm_discovered_facilities.feature_type IS
  'OSM amenity type: hospital or pharmacy.';
COMMENT ON COLUMN app.osm_discovered_facilities.verification_status IS
  'Always unverified for OSM-sourced rows. Never assume operational status.';

CREATE INDEX osm_discovered_location_gix ON app.osm_discovered_facilities USING gist (location);
CREATE INDEX osm_discovered_feature_type_idx ON app.osm_discovered_facilities (feature_type);
CREATE INDEX osm_discovered_verification_idx
  ON app.osm_discovered_facilities (verification_status, last_synced_at DESC);

CREATE TRIGGER osm_discovered_facilities_set_updated_at
  BEFORE UPDATE ON app.osm_discovered_facilities
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

ALTER TABLE app.osm_discovered_facilities ENABLE ROW LEVEL SECURITY;
