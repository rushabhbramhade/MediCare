-- 0002_app_schema.sql
--
-- Foundation tables only. Clinical modules (records, medicines, appointments,
-- care plans) are intentionally absent until their requirements, consent model
-- and clinical governance are settled.
--
-- Identity is owned by Supabase Auth. app.users mirrors only the id and role;
-- it never stores passwords, OTPs or refresh tokens.

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.users (
  id          uuid PRIMARY KEY,
  phone       text,
  role        text NOT NULL DEFAULT 'patient'
                CHECK (role IN ('patient', 'doctor', 'pharmacist', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.users IS
  'Local mirror of a Supabase auth user. id must equal auth.users.id; credentials live only in Supabase.';

CREATE TABLE app.patient_profiles (
  user_id                 uuid PRIMARY KEY REFERENCES app.users (id) ON DELETE CASCADE,
  display_name            text,
  date_of_birth           date,
  gender                  text CHECK (gender IN ('female', 'male', 'other', 'prefer_not_to_say')),
  preferred_language      text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
  emergency_contact_name  text,
  emergency_contact_phone text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.patient_profiles IS
  'Minimal patient profile. Address and government identifiers are deliberately not stored yet.';

CREATE TABLE app.consents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES app.users (id) ON DELETE CASCADE,
  purpose           text NOT NULL
                      CHECK (purpose IN ('icare', 'record_processing', 'caregiver_access', 'provider_sharing')),
  document_version  text NOT NULL,
  granted_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz,
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

COMMENT ON TABLE app.consents IS
  'Append-only consent grants. Revoke by setting revoked_at; never delete a record.';

CREATE INDEX consents_active_user_idx
  ON app.consents (user_id, purpose)
  WHERE revoked_at IS NULL;

CREATE TABLE app.audit_logs (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id       uuid,
  action         text NOT NULL,
  resource_type  text NOT NULL,
  resource_id    text,
  request_id     text,
  ip             inet,
  user_agent     text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.audit_logs IS
  'Security-relevant events. No actor foreign key: logs must survive account deletion.';

CREATE INDEX audit_logs_actor_idx ON app.audit_logs (actor_id, created_at DESC);
CREATE INDEX audit_logs_created_idx ON app.audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON app.users
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER patient_profiles_set_updated_at
  BEFORE UPDATE ON app.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- Default-deny for every role except the table owner (the API's connection).
-- Row-level policies arrive with the patient-facing features that need them.
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.audit_logs ENABLE ROW LEVEL SECURITY;
