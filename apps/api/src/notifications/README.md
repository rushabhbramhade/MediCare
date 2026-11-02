# Notifications

**Status:** Deferred — foundation only

## Responsibility

Transactional SMS, email and push notifications through provider adapters, queued on the notification worker.

## Data owned

- `app.notification_outbox` (future)
- `QUEUES.notifications` job payloads

## Planned HTTP surface

- Internal/service-triggered only; no public send endpoint

## Security and safety notes

Never include clinical details in SMS or email. OTP delivery belongs to Supabase Auth, not this module. Provider credentials are server-side only.

## Next step

Choose an SMS/email provider, add the outbox migration and implement the notification worker handler.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
