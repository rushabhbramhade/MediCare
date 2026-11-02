# Monorepo structure

pnpm workspaces + Turborepo. TypeScript is strict everywhere; Python is independent.

```
apps/
  web/        Next.js 16 App Router, React 19, Tailwind 4, PWA
  api/        NestJS 12 modular monolith, Swagger in non-production
  ai/         FastAPI + Pydantic, provider-agnostic iCare pipeline
packages/
  types/      Shared domain types (AuthUser, ApiErrorBody, Paginated)
  contracts/  API routes, response interfaces, version constant
  validators/ Zod schemas shared by web and API
  config/     Env schemas, queue names, env loader
  api-client/ Typed fetch wrapper for the API
workers/
  document-worker/
  inventory-sync-worker/
  notification-worker/
database/     SQL migrations, policies, functions, diagrams, no seeds
infrastructure/ Compose, Postgres image, scripts, deployment, monitoring
docs/         Architecture, security, database, API, integrations, governance
```

## Dependency direction

```
types  <-  contracts
types  <-  validators (domain schemas, no transport)
config <-  API, workers
contracts + api-client <- web
validators <- web + API
```

Rules:

- `packages/*` never import from `apps/*` or `workers/*`.
- The browser imports only `@medicare/types`, `@medicare/contracts`,
  `@medicare/validators` and `@medicare/api-client`.
- `@medicare/config` is server/worker only: it reads `process.env` and must not be
  imported into a client component.
- Python does not import TypeScript packages. The HTTP contract is the boundary; keep
  request/response names aligned by hand and cover them with endpoint tests.

## Build order

Turborepo `dependsOn: ["^build"]` builds shared packages before apps and workers.
Each shared package compiles to CommonJS `dist/` with `tsc`. Apps consume the built
package, not `src`, so `pnpm build` works from a clean checkout.

## Adding a module

1. Create `apps/api/src/<module>/` with controller, service, module and README.
2. Put the request schema in `packages/validators` and the route in
   `packages/contracts` if the web needs it.
3. Add the migration under `database/migrations` with a new number.
4. Add tests next to the service and at least one endpoint test.
5. Update the docs that describe the module's data and consent behaviour.

Do not add a module folder without behaviour; the existing deferred modules are
README-only on purpose.
