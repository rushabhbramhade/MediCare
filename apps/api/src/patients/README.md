# Patients

**Status:** Deferred — foundation only

## Responsibility

Patient and caregiver profiles linked to the Supabase auth identity, including demographics, language preference and emergency contacts.

## Data owned

- `app.patient_profiles` (one row per Supabase `auth.users.id`)
- `app.caregiver_links` (consent-backed relationships)

## Planned HTTP surface

- `GET /v1/patients/me`
- `PATCH /v1/patients/me`
- `GET /v1/patients/:id` (caregiver with active consent only)

## Security and safety notes

Every read and write is scoped to the authenticated subject or an explicit caregiver consent grant. Supabase auth tables are never duplicated or exposed.

## Next step

Create the profile migration after hosted Supabase Auth is configured; add the profile-completion flow in the web app.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
