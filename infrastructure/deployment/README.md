# Deployment

This repository contains no cloud manifests. These are the steps a deployment must
perform; the target platform is undecided.

## Build

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @medicare/api start          # node dist/main.js
pnpm --filter @medicare/web start          # next start
cd apps/ai && uv sync --no-dev && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Workers are separate processes:

```bash
pnpm --filter @medicare/document-worker start
pnpm --filter @medicare/inventory-sync-worker start
pnpm --filter @medicare/notification-worker start
```

## Order

1. Provision Postgres with the extensions listed in `database/extensions/README.md`
   and a Redis instance.
2. Set every required variable from `.env.example`. The API refuses to boot on invalid
   config; that is intentional.
3. Run `pnpm db:migrate` once per release, before starting new app processes.
4. Start API, web and AI. AI requires `INTERNAL_SERVICE_TOKEN` for internal endpoints.
5. Start workers only if their integrations are configured. In this build they fail
   every job by design.

## Security checklist

- TLS terminated in front of every public process.
- `NODE_ENV=production` requires `ENCRYPTION_KEY`; Swagger is disabled in production.
- `API_CORS_ORIGINS` is an explicit allowlist, never `*`.
- Supabase service role key exists only in server-side environments.
- Database and Redis are not publicly reachable.
- Run `pnpm check:secrets` in CI and as a pre-deploy gate.

## Not provided

No container images for the app processes, no reverse proxy config, no backup or
restore procedure, no zero-downtime strategy. Migrations are transactional but not
online-safe for large tables; review locks before altering clinical data.
