# 0005 — Persistent audit with an explicit failure policy

**Status:** accepted

## Context

The foundation logged audit events through `pino` only. That is not an audit trail: logs
rotate, are not queryable with the data they describe, and cannot support an
accountability claim. Milestone 2 adds profile writes and hospital search, so the
question of what happens when the audit write fails now matters.

Two failure modes are possible:

- **Fail-open:** the request succeeds and the audit event is lost. Good availability,
  weak accountability.
- **Fail-closed:** the request fails because the audit event could not be written. Strong
  accountability, worse availability.

Using one policy for every request is wrong. A patient reading their own profile should
not be blocked by an audit outage; a profile mutation should not commit without a trail.

## Decision

- Audit events are written to `app.audit_logs`.
- **Mutations are fail-closed.** `PatientsService` inserts the audit row on the same
  transaction as the profile change. If the insert fails, the transaction rolls back and
  the API returns an error.
- **Reads and generic request events are fail-open.** `AuditService.record()` logs
  `audit_persist_failed` and continues. This includes profile reads, the generic
  interceptor event and guard-level auth failures.
- One event is written per logical action:
  - services write rich events for `@ServiceAudited()` routes;
  - the interceptor skips success on those routes but records failures;
  - the exception filter writes guard-level 401/403 once, before interceptors run.
- Metadata is scrubbed before insert: passwords, OTPs, tokens, secrets, API keys,
  authorization headers, cookies, phone, email, address and clinical content are
  dropped, not masked.
- The table is append-only. Triggers reject `UPDATE`, `DELETE` and `TRUNCATE` for every
  role, including the connection owner. RLS remains default-deny for other roles.
- There is no patient-facing read, update or delete path.

## Consequences

- A database outage that affects audit writes will reject profile writes, which is the
  intended trade-off. Reads continue and may be unaudited.
- `audit_persist_failed` needs an alert; fail-open without monitoring is silent loss.
- Audit rows have no actor foreign key, so they survive account deletion.
- A database superuser can drop the trigger. This protects against ordinary application
  access, not a privileged insider or a compromised owner connection. A write-once
  external sink is still required for a stronger claim.
- Retention, export, an admin read API and per-service database roles remain open work.
