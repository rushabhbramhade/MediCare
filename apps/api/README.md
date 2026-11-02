# API

NestJS 12 modular monolith. REST under `/v1`, OpenAPI at `/docs` outside production.

## Endpoints

| Method | Path               | Auth    | Purpose                                     |
| ------ | ------------------ | ------- | ------------------------------------------- |
| GET    | `/v1/health`       | public  | liveness, no dependencies                   |
| GET    | `/v1/health/ready` | public  | Postgres + Redis readiness, 503 when down   |
| GET    | `/v1/auth/me`      | bearer  | verified identity and application role      |
| GET    | `/v1/patients/me`  | patient | read the linked profile                     |
| PUT    | `/v1/patients/me`  | patient | create or replace the linked profile        |
| PATCH  | `/v1/patients/me`  | patient | update selected profile fields              |
| GET    | `/v1/hospitals`    | bearer  | verified hospital search or no-source state |

Other modules are documented as deferred under `src/<module>/README.md`.

## Commands

```bash
pnpm --filter @medicare/api dev
pnpm --filter @medicare/api build
pnpm --filter @medicare/api typecheck
pnpm --filter @medicare/api test
```

Configuration is validated at boot (`src/config/env.ts`); the process exits on invalid
env. Required for a full boot: `DATABASE_URL`, `REDIS_URL`, `JWT_ISSUER`,
`JWT_AUDIENCE`, `JWT_JWKS_URL`, `API_CORS_ORIGINS`.

## Security

- Global throttle -> JWT verification (JWKS, issuer, audience) -> roles.
- `@Public()` only on health.
- One JSON error envelope with `requestId`; 5xx details are never returned.
- Helmet, explicit CORS allowlist, no auth bypass flag.
- Authenticated requests are audited to the append-only `app.audit_logs`. Profile writes
  are fail-closed; reads and generic request events are fail-open.
- Patient queries scope by the verified JWT subject; request bodies cannot set identity.

## Tests

`vitest` (not Jest): NestJS 12 ships ESM-only packages and Vitest runs them natively.
Unit and controller tests run without a database. Live PostgreSQL/PostGIS integration
tests run only when `DATABASE_URL` is set:

```bash
DATABASE_URL='postgresql://medicare:medicare_local_only@localhost:5432/medicare' pnpm test
```

Without it, the five integration tests are skipped. Turbo forwards `DATABASE_URL` to
the test task.
