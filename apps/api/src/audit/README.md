# Audit

**Status:** Foundation implemented (log stream); persistence deferred

## Responsibility

Records who accessed what, when and with which consent. Currently emits structured `audit_event` log lines through `AuditService`.

## Data owned

- Structured log events today
- `app.audit_events` (future append-only table)

## Planned HTTP surface

- No public HTTP surface
- Admin read API deferred

## Security and safety notes

Never log request bodies, query strings, file contents or AI prompts. A log stream is not a compliance-grade audit trail; persistent storage, immutability and retention are required before clinical use.

## Next step

Add the append-only audit migration and a retention policy; ship to write-once storage or an audited warehouse.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
