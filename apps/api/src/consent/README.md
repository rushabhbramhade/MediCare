# Consent

**Status:** Deferred — foundation only

## Responsibility

Records explicit, scoped, time-bound consent for record sharing, AI processing and provider access, plus revocation history.

## Data owned

- `app.consent_grants`
- `app.consent_events` (append-only)

## Planned HTTP surface

- `GET /v1/consents`
- `POST /v1/consents`
- `POST /v1/consents/:id/revoke`

## Security and safety notes

Access to patient data requires a matching active grant. AI retrieval checks consent before every request. Revocation takes effect immediately and is audited.

## Next step

Define grant scopes with clinical governance before implementing the tables; legal review is required.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
