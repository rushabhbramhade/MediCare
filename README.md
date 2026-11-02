# Medicare

Healthcare navigation for India: nearby hospitals, doctors, emergency resources, medical
records and the iCare AI assistant. This repository is a **working foundation**, not a
launched product.

## Status

| Area                  | State                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Web (Next.js 16, PWA) | Public pages, phone-OTP login UI, protected patient shell, editable patient profile, hospital finder with honest empty states.   |
| API (NestJS 12)       | Health/readiness, `GET /v1/auth/me`, profile read/write, hospital search, JWKS auth, roles, throttling, error envelope, Swagger. |
| AI (FastAPI)          | Safety guard, consent-gated pipeline, provider abstraction. **Provider disabled by default.**                                    |
| Workers (BullMQ)      | Boot and consume queues; jobs fail because no integration exists.                                                                |
| Database              | Extensions, foundation schema, persistent append-only audit trail, PostGIS hospital directory. No seed data.                     |
| Integrations          | Hospital directory adapter is implemented but `disabled`; every provider defaults to `disabled`.                                 |

No hospital, doctor, pharmacy, stock or ambulance data is bundled or invented. No
compliance certification (HIPAA, DPDP, ABDM, ISO) is claimed.

## Quick start

Prerequisites: Node >= 22.12, pnpm 9, Docker (for Postgres/Redis), Python 3.12 + uv (for
the AI service).

```bash
corepack enable
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local

pnpm install
pnpm db:up            # Postgres 16 + pgvector + PostGIS, Redis
pnpm db:migrate       # applies database/migrations

pnpm dev              # web (3000) + API (4000)
pnpm dev:ai           # AI service (8000), separate terminal
```

Without Docker you can still run the web app (public pages) and the API. Readiness will
report dependencies down, and auth stays fail-closed without Supabase configuration.

## Commands

| Command                                        | What it does                            |
| ---------------------------------------------- | --------------------------------------- |
| `pnpm dev`                                     | web + API in watch mode                 |
| `pnpm dev:web`, `pnpm dev:api`, `pnpm dev:ai`  | one process                             |
| `pnpm dev:workers`                             | all three workers (needs Redis)         |
| `pnpm build`                                   | build packages, apps and workers        |
| `pnpm typecheck`                               | TypeScript across the workspace         |
| `pnpm lint`                                    | root ESLint + web ESLint                |
| `pnpm test`                                    | Vitest/Jest across the workspace        |
| `pnpm format`, `pnpm format:check`             | Prettier                                |
| `pnpm db:up`, `pnpm db:down`, `pnpm db:logs`   | local Postgres + Redis                  |
| `pnpm db:migrate`                              | apply migrations (reads `DATABASE_URL`) |
| `pnpm check:secrets`                           | scan for committed secrets              |
| `pnpm ai:sync`, `pnpm ai:lint`, `pnpm ai:test` | Python setup and checks                 |

Live PostgreSQL integration tests run when `DATABASE_URL` is present and are skipped
otherwise:

```bash
DATABASE_URL='postgresql://medicare:medicare_local_only@localhost:5432/medicare' pnpm test
```

Without it, the five integration tests are skipped, not faked.

## Layout

```
apps/web      Next.js 16 App Router, React 19, Tailwind 4, PWA
apps/api      NestJS 12 modular monolith, /v1 REST + Swagger (dev only)
apps/ai       FastAPI iCare service, internal-token auth
packages/     types, contracts, validators, config, api-client
workers/      document, inventory-sync, notification (BullMQ)
database/     migrations, policies, functions, diagrams, no seeds
infrastructure/ Compose, Postgres image, scripts, deployment, monitoring
docs/         architecture, security, database, API, integrations, governance
```

## Configuration

Copy `.env.example` to `.env` (server/workers/migrations) and
`apps/web/.env.example` to `apps/web/.env.local` (browser-safe values). Both real files
are gitignored.

Required for a full local API boot: `DATABASE_URL`, `REDIS_URL`, `JWT_ISSUER`,
`JWT_AUDIENCE`, `JWT_JWKS_URL`, `API_CORS_ORIGINS`.

Optional and disabled by default: Supabase Auth, LLM, OCR, SMS, email, geocoding,
hospital/pharmacy/doctor/ambulance providers. The app does not invent a substitute when
they are missing. `HOSPITAL_PROVIDER=disabled` is the only implemented hospital adapter;
setting another value logs a warning and stays disabled. See `.env.example` for every
variable and its purpose.

## What does not work yet

- Sign-in requires a real Supabase project; without it, patient routes redirect to login.
- iCare is not connected from the web app. The AI service runs, but its provider is off.
- No hospital data is shipped. The hospital finder returns `NO_DATA_SOURCE_CONFIGURED`
  until a licensed provider is implemented; bed and ICU availability are always
  `unknown`.
- Doctors, pharmacies, medicines, ambulances and stock have no provider integration.
- Record upload, OCR and retrieval are not implemented.
- There is no audit read/export API. Rows are written and append-only, but only the
  database owner can query them today.
- No queue producer exists, so workers have nothing to consume.
- No production infrastructure, backups or monitoring stack.

## Documentation

- [Milestone 2 feature notes](docs/features/milestone-2.md)
- [System overview](docs/architecture/system-overview.md)
- [Monorepo structure](docs/architecture/monorepo-structure.md)
- [Data flow](docs/architecture/data-flow.md)
- [Architecture decisions](docs/architecture/decisions/README.md)
- [Security architecture](docs/security/security-architecture.md)
- [Threat model](docs/security/threat-model.md)
- [Database conventions](docs/database/database-conventions.md)
- [API conventions](docs/api/api-conventions.md)
- [Provider integration strategy](docs/integrations/provider-integration-strategy.md)
- [Safety principles](docs/clinical-governance/safety-principles.md)
- [Scope](docs/requirements/scope.md)

Read the safety principles and scope before adding clinical behaviour or any model
output.

## License

MIT. See `LICENSE`.
