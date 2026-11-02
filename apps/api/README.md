# API

NestJS 12 modular monolith. REST under `/v1`, OpenAPI at `/docs` outside production.

## Endpoints

| Method | Path               | Auth   | Purpose                                   |
| ------ | ------------------ | ------ | ----------------------------------------- |
| GET    | `/v1/health`       | public | liveness, no dependencies                 |
| GET    | `/v1/health/ready` | public | Postgres + Redis readiness, 503 when down |
| GET    | `/v1/auth/me`      | bearer | verified identity and application role    |

Everything else is a documented deferred module under `src/<module>/README.md`.

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
- Audit interceptor logs mutating authenticated requests; database persistence is
  pending.

## Tests

`vitest` (not Jest): NestJS 12 ships ESM-only packages and Vitest runs them natively.
Health service, auth service and the Zod pipe have unit tests. There is no database
integration test yet, so the readiness/query path is not proven against real Postgres by
CI.
