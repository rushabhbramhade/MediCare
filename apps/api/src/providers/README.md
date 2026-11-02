# Providers

**Status:** Deferred — foundation only

## Responsibility

Integration registry and adapters for hospital, pharmacy, doctor and ambulance partners: authentication, webhooks, retries and failure isolation.

## Data owned

- `app.provider_connections` (encrypted credentials reference)
- Adapter implementations under each domain module

## Planned HTTP surface

- Admin-only configuration API (deferred)

## Security and safety notes

Credentials come from the secret manager, never source control. Verify webhook signatures. Adapters must time out and degrade to a clear "unavailable" state, never fabricated data.

## Next step

Read docs/integrations/provider-integration-strategy.md, then implement one adapter against a real sandbox.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
