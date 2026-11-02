# Scope

## Built in this foundation

- Monorepo tooling: pnpm workspaces, Turborepo, strict TypeScript, ESLint, Prettier.
- Shared types, contracts, Zod validators, env config and a typed API client, with tests.
- Next.js web: public landing and emergency pages, phone-OTP login UI, protected patient
  shell, eight patient routes, Leaflet map, TanStack Query health card, Zustand location
  store, PWA manifest/service worker/icons, security headers, auth proxy.
- NestJS API: config validation, Postgres/Redis clients, health/readiness, JWKS auth,
  roles, throttling, audit interceptor, error envelope, Zod pipe, Swagger, tests.
- Patient profile: `GET|PUT|PATCH /v1/patients/me`, subject-scoped SQL, verified phone
  only, accessibility preferences, validation and web form.
- Persistent append-only audit: `app.audit_logs`, fail-closed profile writes,
  fail-open reads/generic events, metadata scrubbing, UPDATE/DELETE/TRUNCATE triggers.
- Hospital discovery: authenticated PostGIS search over `verified`/`stale` rows,
  distance ordering, specialty/emergency filters, pagination, source/freshness labels,
  and an explicit `NO_DATA_SOURCE_CONFIGURED` response. Provider remains disabled.
- FastAPI AI: settings validation, internal-token auth, emergency guard, intent
  routing, provider abstraction (disabled), consent-gated retrieval interface,
  redaction, output validation, symptom/report endpoints, tests.
- Three BullMQ workers that boot and fail unconfigured jobs honestly.
- Postgres extensions, foundation schema, checksummed migration runner, local Compose,
  custom Postgres image.
- Docs, ADRs, threat model, CI, secret scan.

## Deferred (folder/documentation exists, behaviour does not)

- Doctor, pharmacy, ambulance and medicine discovery.
- A licensed hospital data source, bed/ICU availability, ratings and wait times.
- Appointments, prescriptions, care plans, caregiver links.
- Medical record upload, storage, OCR and retrieval.
- Any provider integration, including LLM, SMS, email and maps geocoding.
- Audit read/export API, retention policy and external write-once sink.
- Queue producers; no app code enqueues jobs yet.
- Consent management UI and account deletion.

## Explicitly out of scope for now

- Diagnosing, prescribing, dosing or triage beyond fixed emergency escalation.
- Claims of HIPAA, DPDP, ABDM or ISO compliance. None is certified.
- Fabricated hospitals, doctors, pharmacies, stock, testimonials or certifications.
- Native mobile apps. The product is a mobile-first PWA.
- Multi-region deployment, Kubernetes, Terraform or autoscaling.
- Payments and insurance.

## Regulatory note

This is health-adjacent software handling sensitive personal data. Before real patient
use, obtain Indian legal and clinical review, including obligations under the DPDP Act
2023 and applicable medical-device/telemedicine rules. Nothing in this repository
constitutes legal advice or a compliance certification.

## Definition of done for the next milestone

A single vertical slice that is real end to end: authenticated profile read/write,
audit-log persistence, and hospital discovery backed by a licensed source (or an
explicit "no source configured" response), with tests and no invented data.
