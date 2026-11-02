# Audit

**Status:** Implemented — persistent append-only trail

## Responsibility

Record who did what, when, with which outcome and request id. Events go to structured
logs and to `app.audit_logs`. There is no patient-facing read API.

## Data owned

- `app.audit_logs` — actor, role, action, resource, request id, outcome, status,
  duration, source and sanitised metadata
- No actor foreign key: audit rows survive account deletion

## Entry points

- `PatientsService` writes rich `patient_profile.created`, `.updated` and `.read` events.
- `AuditLogInterceptor` writes one generic success or failure event per authenticated
  request. Success is skipped for routes marked `@ServiceAudited()` so a service event
  is not duplicated; failures are still recorded there because a rolled-back mutation
  has no persisted service event.
- `ApiExceptionFilter` records guard-level `401`/`403` events once, because guards run
  before interceptors.

## Failure policy

| Path                                    | Policy      | Behaviour                                               |
| --------------------------------------- | ----------- | ------------------------------------------------------- |
| Profile create/update (`recordWithin`)  | fail-closed | Audit insert shares the transaction; failure rolls back |
| Profile read and generic request events | fail-open   | Failure is logged; the request continues                |

Fail-open is a deliberate availability trade-off, not a claim that every read is
audited. A monitoring alert on `audit_persist_failed` is still required.

## Security and safety notes

- `sanitizeAuditMetadata` drops keys matching password, OTP, token, secret, API key,
  authorization, cookie, report, document, content, phone, email and address. It caps
  strings at 256 characters, keys at 20 and depth at 2.
- Request bodies and query strings are never recorded.
- Database triggers reject `UPDATE`, `DELETE` and `TRUNCATE` on `app.audit_logs`,
  including for the owner connection. RLS stays default-deny for other roles.
- A database superuser can still drop the trigger; this is tamper-evident only against
  ordinary application access, not a write-once storage guarantee.
- No retention, export or admin read API exists yet.

See [ADR-0005](../../../../docs/architecture/decisions/0005-audit-persistence-and-failure-policy.md)
and [Milestone 2 notes](../../../../docs/features/milestone-2.md).
