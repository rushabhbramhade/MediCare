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
| Integrations          | Hospital directory adapter implemented but `disabled`; OSM Overpass discovery for hospitals/pharmacies (results unverified); every provider defaults to `disabled`. |

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

Optional and disabled by default: Supabase Auth, LLM, SMS, email, geocoding,
hospital/pharmacy/doctor/ambulance providers. The app does not invent a substitute when
they are missing. `HOSPITAL_PROVIDER=disabled` is the only implemented hospital adapter;
setting another value logs a warning and stays disabled. See `.env.example` for every
variable and its purpose.

### Google Maps Platform

To use Google Maps instead of OpenStreetMap tiles:

**Backend** (`.env` at repo root — never commit real values):
```
GOOGLE_MAPS_SERVER_API_KEY=YOUR_SERVER_MAPS_KEY
GOOGLE_MAPS_REGION=IN
GOOGLE_MAPS_LANGUAGE=en
```

**Frontend** (`apps/web/.env.local` — browser-safe, `NEXT_PUBLIC_*` only):
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_WEB_MAPS_KEY
NEXT_PUBLIC_MAP_PROVIDER=google
NEXT_PUBLIC_MAP_DEFAULT_LAT=18.5204
NEXT_PUBLIC_MAP_DEFAULT_LNG=73.8567
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12
NEXT_PUBLIC_MAP_DEFAULT_RADIUS_KM=10
NEXT_PUBLIC_MAP_MAX_RADIUS_KM=50
```

The backend key (`GOOGLE_MAPS_SERVER_API_KEY`) is used only by NestJS server-side
calls to the Places API (New), Geocoding API, and Routes API. It is never sent to the
browser. The browser key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) loads the Maps JavaScript
API for map rendering. Leave `NEXT_PUBLIC_MAP_PROVIDER=osm` (the default) to keep
OpenStreetMap tiles without any key.

Enable the following Google Cloud APIs in your project:
- Maps JavaScript API
- Places API (New)
- Geocoding API
- Routes API


### OpenStreetMap Overpass Discovery (free, no API key)

Medicare uses the public OpenStreetMap Overpass API for hospital and pharmacy
discovery. No API key is required. Results are **never** marked verified — OSM
is not a medical directory.

**Backend** (`.env` at repo root):
```
OSM_OVERPASS_API_URL=https://overpass-api.de/api/interpreter
OSM_OVERPASS_TIMEOUT_SECONDS=30
OSM_CACHE_TTL_SECONDS=3600
```

**API endpoints** (require Supabase authentication):
- `GET /v1/osm/hospitals?latitude=&longitude=&radiusMeters=` — hospital features near a point
- `GET /v1/osm/pharmacies?latitude=&longitude=&radiusMeters=` — pharmacy features near a point

All results include:
- `source: "openstreetmap"` attribution
- `verificationStatus: "unverified"` — OSM data is unverified
- `bedAvailability: "unknown"` — no bed/ICU data from OSM
- `operationalStatus: "unknown"` — operational status unknown
- `lastSyncedAt` — timestamp of data fetch

Results are cached in Redis with a configurable TTL. Requests are throttled
(30 requests per minute by default).

Results must not be represented as verified hospitals, operational
facilities, or currently available services without independent verification.



### Local OCR (Tesseract — free, no paid API key)

Medicare uses Tesseract OCR for local text extraction from medical documents.
No Google Vision, Azure OCR, or other paid OCR API is involved. OCR works
independently of `AI_PROVIDER`.

**Backend** (`.env` at repo root — never commit real values):
```
OCR_PROVIDER=tesseract
OCR_API_URL=
OCR_API_KEY=
OCR_LANGUAGES=eng,hin,mar
OCR_MAX_FILE_SIZE_MB=20
OCR_MAX_PAGES=50
OCR_TIMEOUT_SECONDS=120
AI_SERVICE_URL=http://localhost:8000
INTERNAL_SERVICE_TOKEN=<generate with: openssl rand -hex 32>
```

**Install Tesseract:**

macOS (Homebrew):
```bash
brew install tesseract tesseract-lang
tesseract --version
tesseract --list-langs   # confirms eng, hin, mar are available
```

Docker/Linux: Tesseract is installed in the AI service Docker image
(`apps/ai/Dockerfile`) via `apt-get install tesseract-ocr tesseract-ocr-eng
tesseract-ocr-hin tesseract-ocr-mar poppler-utils`.

**Run the AI service:**
```bash
cd apps/ai
uv sync --all-extras
uv run uvicorn app.main:app --reload --port 8000
```

**Run the document worker:**
```bash
cd workers/document-worker
pnpm install
pnpm dev
```

**API endpoints** (all require `X-Internal-Token`, called only by the NestJS API):
- `POST /v1/ocr/process` — process a document through local Tesseract OCR
- `GET /v1/ocr/status/:job_id` — get OCR processing status and results

**NestJS API endpoints** (require Supabase authentication):
- `POST /v1/medical-records/:id/ocr` — trigger OCR for a document
- `GET /v1/medical-records/:id/ocr` — get OCR results
- `GET /v1/medical-records/:id/ocr/status` — get OCR processing status

**Supported document types:** PDF (text-based and scanned), JPG, JPEG, PNG.
**Supported languages:** English (eng), Hindi (hin), Marathi (mar).

OCR extracts text without making medical conclusions. Extracted content requires
patient review before being used by iCare AI. No medical data is invented or
assumed.


## What does not work yet

- Sign-in requires a real Supabase project; without it, patient routes redirect to login.
- iCare is not connected from the web app. The AI service runs, but its provider is off.
- No hospital data is shipped. The hospital finder returns `NO_DATA_SOURCE_CONFIGURED`
  until a licensed provider is implemented; bed and ICU availability are always
  `unknown`.
- Doctors, pharmacies, medicines, ambulances and stock have no provider integration.
- Record upload and retrieval are not implemented. OCR is implemented via Tesseract
  (see Configuration above) but requires document upload infrastructure to be complete.
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
