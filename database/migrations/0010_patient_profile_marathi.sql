-- 0010_patient_profile_marathi.sql
--
-- Medicare supports English, Hindi and Marathi as profile languages.
-- Widen the closed set without touching existing rows.

ALTER TABLE app.patient_profiles
  DROP CONSTRAINT patient_profiles_preferred_language_check;

ALTER TABLE app.patient_profiles
  ADD CONSTRAINT patient_profiles_preferred_language_check
    CHECK (preferred_language IN ('en', 'hi', 'mr'));

COMMENT ON COLUMN app.patient_profiles.preferred_language IS
  'Patient-facing language preference: English (en), Hindi (hi) or Marathi (mr).';
