-- 0006_auth_roles.sql
--
-- Aligns the stored role vocabulary with the application's seven roles and
-- repairs the original CHECK constraint, which listed `pharmacist` and omitted
-- caregiver, hospital, pharmacy and ambulance roles.
--
-- Existing rows are migrated. Audit rows are append-only, so their historical
-- role values stay valid through the superset check below.

ALTER TABLE app.users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE app.users
SET role = CASE role
  WHEN 'pharmacist' THEN 'pharmacy_admin'
  WHEN 'admin' THEN 'platform_admin'
  WHEN 'hospital' THEN 'hospital_admin'
  WHEN 'pharmacy' THEN 'pharmacy_admin'
  WHEN 'ambulance' THEN 'ambulance_provider'
  ELSE role
END
WHERE role IN ('pharmacist', 'admin', 'hospital', 'pharmacy', 'ambulance');

ALTER TABLE app.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN (
      'patient', 'caregiver', 'doctor', 'hospital_admin',
      'ambulance_provider', 'pharmacy_admin', 'platform_admin'
    )
  );

ALTER TABLE app.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_role_check;

ALTER TABLE app.audit_logs
  ADD CONSTRAINT audit_logs_actor_role_check CHECK (
    actor_role IS NULL
    OR actor_role IN (
      -- current vocabulary
      'patient', 'caregiver', 'doctor', 'hospital_admin',
      'ambulance_provider', 'pharmacy_admin', 'platform_admin',
      -- historical values kept because audit rows cannot be updated
      'hospital', 'pharmacy', 'ambulance', 'admin', 'pharmacist'
    )
  );

COMMENT ON COLUMN app.users.role IS
  'Application role. Assigned only by trusted server-side administration, never by the user.';
