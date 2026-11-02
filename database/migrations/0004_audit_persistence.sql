-- 0004_audit_persistence.sql
--
-- Turns the existing app.audit_logs table into a persistent, append-only trail.
-- The API writes through the owner connection; RLS stays default-deny for every
-- other role, and this trigger blocks UPDATE/DELETE/TRUNCATE even for the owner.

ALTER TABLE app.audit_logs
  ADD COLUMN actor_role text,
  ADD COLUMN outcome text NOT NULL DEFAULT 'success',
  ADD COLUMN status_code integer,
  ADD COLUMN duration_ms integer,
  ADD COLUMN source text NOT NULL DEFAULT 'api';

ALTER TABLE app.audit_logs
  ADD CONSTRAINT audit_logs_outcome_check
    CHECK (outcome IN ('success', 'failure')),
  ADD CONSTRAINT audit_logs_actor_role_check
    CHECK (
      actor_role IS NULL
      OR actor_role IN (
        'patient', 'caregiver', 'doctor', 'hospital', 'pharmacy', 'ambulance', 'admin'
      )
    ),
  ADD CONSTRAINT audit_logs_action_check
    CHECK (char_length(action) BETWEEN 1 AND 200),
  ADD CONSTRAINT audit_logs_status_code_check
    CHECK (status_code IS NULL OR status_code BETWEEN 100 AND 599),
  ADD CONSTRAINT audit_logs_duration_ms_check
    CHECK (duration_ms IS NULL OR duration_ms >= 0),
  ADD CONSTRAINT audit_logs_source_check
    CHECK (char_length(source) BETWEEN 1 AND 64);

CREATE INDEX audit_logs_action_created_idx
  ON app.audit_logs (action, created_at DESC);

CREATE OR REPLACE FUNCTION app.reject_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'app.audit_logs is append-only; % is not permitted', TG_OP
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON app.audit_logs
  FOR EACH ROW EXECUTE FUNCTION app.reject_audit_log_mutation();

CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON app.audit_logs
  FOR EACH ROW EXECUTE FUNCTION app.reject_audit_log_mutation();

CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON app.audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION app.reject_audit_log_mutation();

COMMENT ON TABLE app.audit_logs IS
  'Append-only security events. No actor foreign key: rows survive account deletion.';
COMMENT ON COLUMN app.audit_logs.metadata IS
  'Safe structured context only. Never tokens, OTPs, request bodies or clinical content.';
