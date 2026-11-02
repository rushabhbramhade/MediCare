# Row-level security

## Current posture

RLS is **enabled** on `app.users`, `app.patient_profiles`, `app.consents` and
`app.audit_logs` with **no policies**. That is default-deny: Supabase's `anon` and
`authenticated` roles cannot read or write these tables directly through PostgREST.

The API connects with the table owner (`DATABASE_URL`), which bypasses RLS. All patient
data access therefore goes through the API, where authentication, roles and audit
logging are enforced. The browser never receives a database credential.

## Why no policies yet

Policies written before the endpoints exist tend to encode guesses. The correct policy
depends on how a request is authenticated and on which consent grants access. Writing
`auth.uid()` policies now would also require a Supabase-specific `auth` schema that the
local database does not have.

## Before enabling direct client access

1. Decide whether any client may talk to PostgREST at all. The default answer is no.
2. Add per-table `SELECT`/`INSERT`/`UPDATE` policies keyed on `auth.uid()`.
3. Add consent checks for caregiver and provider access, not just ownership.
4. Never expose `audit_logs` to clients.
5. Test policies with the `authenticated` role, not the owner, or they prove nothing.
