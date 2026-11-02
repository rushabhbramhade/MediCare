# Functions and triggers

## `app.set_updated_at()`

`plpgsql` trigger function that sets `NEW.updated_at = now()`. Attached to
`app.users`, `app.patient_profiles` and `app.hospitals`.

Application code must not rely on `updated_at` for optimistic concurrency; it is an
audit convenience. Add a `version` column when real concurrent editing exists.

## `app.reject_audit_log_mutation()`

Raises an exception on `UPDATE`, `DELETE` or `TRUNCATE` of `app.audit_logs`. The
triggers are attached to the table and apply to the owner connection as well. A
superuser can still drop them; this is not a write-once external sink.

## Deliberately absent

- No `updated_at` trigger on `app.consents`: consent rows are append-only, and
  revocation sets `revoked_at` explicitly.
- No soft-delete helper. Clinical data deletion must be a reviewed workflow, not a
  trigger.
- No custom distance function: hospital search uses `ST_DWithin`, `ST_Distance` and a
  GiST index directly. Add wrappers only if a second caller needs them.
