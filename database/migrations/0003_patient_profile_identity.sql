-- 0003_patient_profile_identity.sql
--
-- Completes the patient profile without duplicating Supabase Auth.
-- `user_id` remains the link to the verified identity (auth.users.id mirrored in
-- app.users). `id` is the internal profile identifier used by the API.
--
-- The table was empty in the foundation build, so full_name can be made NOT NULL
-- without inventing a placeholder for existing rows.

ALTER TABLE app.patient_profiles RENAME COLUMN display_name TO full_name;

ALTER TABLE app.patient_profiles
  ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN phone text,
  ADD COLUMN accessibility_preferences text[] NOT NULL DEFAULT '{}';

ALTER TABLE app.patient_profiles
  ALTER COLUMN full_name SET NOT NULL,
  ADD CONSTRAINT patient_profiles_id_key UNIQUE (id),
  ADD CONSTRAINT patient_profiles_full_name_check
    CHECK (char_length(full_name) BETWEEN 1 AND 120),
  ADD CONSTRAINT patient_profiles_phone_check
    CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$'),
  ADD CONSTRAINT patient_profiles_accessibility_preferences_check
    CHECK (
      accessibility_preferences
        <@ ARRAY['large_text', 'high_contrast', 'screen_reader', 'reduced_motion']::text[]
    );

COMMENT ON COLUMN app.patient_profiles.id IS
  'Internal profile identifier. Never used for authentication; user_id is the identity link.';
COMMENT ON COLUMN app.patient_profiles.phone IS
  'Only populated from a verified identity-provider claim, never from a request body.';
COMMENT ON COLUMN app.patient_profiles.accessibility_preferences IS
  'Closed set of accessibility options; validated by the API and the CHECK constraint.';
