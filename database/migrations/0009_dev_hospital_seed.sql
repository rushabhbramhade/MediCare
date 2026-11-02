-- 0009_dev_hospital_seed.sql
--
-- Safe development seed for hospital discovery. Records are clearly marked as
-- development/sample data (provider = 'dev-sample') and are never presented as
-- verified clinical information. Seeding is idempotent: re-running does not
-- create duplicates or overwrite existing rows from other providers.
--
-- No bed counts, ICU availability or clinical capacity is invented. The
-- hospital_availability table is intentionally left empty: unknown availability
-- is displayed as unknown, never inferred.

INSERT INTO app.hospitals (
  provider, external_id, name, address_line, city, state, postal_code,
  country_code, location, phone, hospital_type, is_active,
  has_emergency, specialties, verification_status, last_synced_at,
  last_verified_at
) VALUES
  ('dev-sample', 'dev-sample-001', 'Sample General Hospital (Dev)',
   'Sample Road, Bandra West', 'Mumbai', 'Maharashtra', '400050',
   'IN', ST_SetSRID(ST_MakePoint(72.8336, 19.0596), 4326)::geography,
   '+912200000001', 'private', true,
   true, ARRAY['general_medicine', 'cardiology'], 'verified',
   now(), now()),
  ('dev-sample', 'dev-sample-002', 'Sample City Hospital (Dev)',
   'Sample Marg, Andheri East', 'Mumbai', 'Maharashtra', '400069',
   'IN', ST_SetSRID(ST_MakePoint(72.8648, 19.1136), 4326)::geography,
   '+912200000002', 'government', true,
   true, ARRAY['general_medicine', 'emergency', 'pediatrics'], 'verified',
   now(), now()),
  ('dev-sample', 'dev-sample-003', 'Sample Specialty Clinic (Dev)',
   'Sample Lane, Juhu', 'Mumbai', 'Maharashtra', '400049',
   'IN', ST_SetSRID(ST_MakePoint(72.8229, 19.0932), 4326)::geography,
   '+912200000003', 'clinic', true,
   false, ARRAY['general_medicine', 'dermatology'], 'verified',
   now(), now()),
  ('dev-sample', 'dev-sample-004', 'Sample Multi Specialty Centre (Dev)',
   'Sample Street, Powai', 'Mumbai', 'Maharashtra', '400076',
   'IN', ST_SetSRID(ST_MakePoint(72.9056, 19.1179), 4326)::geography,
   '+912200000004', 'multi_specialty', true,
   true, ARRAY['cardiology', 'orthopedics', 'neurology'], 'verified',
   now(), now()),
  ('dev-sample', 'dev-sample-005', 'Sample Inactive Hospital (Dev)',
   'Sample Nagar, Borivali West', 'Mumbai', 'Maharashtra', '400092',
   'IN', ST_SetSRID(ST_MakePoint(72.8412, 19.2307), 4326)::geography,
   '+912200000005', 'private', false,
   false, ARRAY['general_medicine'], 'verified',
   now(), now())
ON CONFLICT (provider, external_id) DO NOTHING;

COMMENT ON COLUMN app.hospitals.provider IS
  'Records seeded by this migration carry provider = ''dev-sample'' and are clearly development data.';
