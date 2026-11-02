# Notification worker

**Status:** scaffolding — no SMS or email provider is integrated.

Consumes `notifications` jobs and fails them as unrecoverable. Silently discarding a
notification would hide delivery failures; the queue record makes the gap visible.

## When it gains real behaviour

1. Pick a provider with a real sending contract and DLT/TRAI compliance where applicable.
2. Add an adapter with retry classification (transient vs permanent failure).
3. Add a `notification_deliveries` table so delivery status is auditable.
4. Replace the failure branch with the adapter call.

Never use a notification channel to send diagnosis, dosing or results; send only a
"something is ready" pointer into the authenticated app.

## Run

```bash
pnpm --filter @medicare/notification-worker dev   # requires REDIS_URL
pnpm --filter @medicare/notification-worker build
```

Required env: `REDIS_URL`; optional `QUEUE_PREFIX`, `LOG_LEVEL`. See `.env.example`.
