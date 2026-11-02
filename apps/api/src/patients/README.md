# Patients

**Status:** Implemented — authenticated profile read/write

## Responsibility

The patient's own profile: name, date of birth, gender, preferred language,
accessibility preferences and the phone number verified by the identity provider.

Caregiver access, emergency contacts and profiles for other users remain deferred.

## Data owned

- `app.patient_profiles` (one row per Supabase `auth.users.id`)
- `app.users` mirror row (id, phone, role) is created/updated on the first write

`user_id` is the identity link and comes only from the verified JWT. `id` is the
internal profile identifier; it is never used for authentication. `phone` is populated
only from the verified `phone` claim, never from a request body.

## HTTP surface

| Method | Path              | Role    | Purpose                                      |
| ------ | ----------------- | ------- | -------------------------------------------- |
| GET    | `/v1/patients/me` | patient | Read the profile linked to the verified user |
| PUT    | `/v1/patients/me` | patient | Create or replace the whole profile          |
| PATCH  | `/v1/patients/me` | patient | Update selected fields                       |

- `GET` and `PATCH` return `404 profile_not_found` when no profile exists.
- `PUT` upserts and is safe to retry.
- Request bodies are strict Zod objects; `phone`, `userId` and unknown fields are
  rejected.
- Reads are throttled at 60/min, writes at 30/min.

## Security and safety notes

Every query is scoped by `user_id = $1` from the verified token. No service method
accepts a user id from the request body. Writes run in one transaction with the audit
insert, so a failed audit write rolls the profile change back (fail-closed). Reads use
fail-open audit writes: a persistence failure is logged but does not block the read.

The profile response never includes clinical content, credentials or the Supabase
session. See [Milestone 2 notes](../../../../docs/features/milestone-2.md) and the API
conventions in [docs/api](../../../../docs/api/api-conventions.md).
