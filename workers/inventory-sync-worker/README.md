# Inventory sync worker

**Status:** scaffolding — no pharmacy provider is integrated.

Consumes `inventory-sync` jobs and fails them as unrecoverable. Stock levels and prices are
never synthesised: showing invented availability could send a patient to a pharmacy that
cannot serve them.

## When it gains real behaviour

1. Sign a data agreement with a pharmacy aggregator or onboard a pharmacy directly.
2. Add a provider adapter and a `pharmacy_stock` table with source and `observed_at`.
3. Replace the failure branch with the adapter call and keep stale data visibly stale.

## Run

```bash
pnpm --filter @medicare/inventory-sync-worker dev   # requires REDIS_URL
pnpm --filter @medicare/inventory-sync-worker build
```

Required env: `REDIS_URL`; optional `QUEUE_PREFIX`, `LOG_LEVEL`. See `.env.example`.
