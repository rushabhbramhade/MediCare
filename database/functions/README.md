# Functions and triggers

## `app.set_updated_at()`

`plpgsql` trigger function that sets `NEW.updated_at = now()`. Attached to
`app.users` and `app.patient_profiles`.

Application code must not rely on `updated_at` for optimistic concurrency; it is an
audit convenience. Add a `version` column when real concurrent editing exists.

## Deliberately absent

- No `updated_at` trigger on `app.consents`: consent rows are append-only, and
  revocation sets `revoked_at` explicitly.
- No soft-delete helper. Clinical data deletion must be a reviewed workflow, not a
  trigger.
- No search or distance functions yet. Add them beside the feature that needs them,
  with tests against the real extension versions.
