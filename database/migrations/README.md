# Migrations

Plain SQL, applied in filename order by `infrastructure/scripts/migrate.mjs`.

| File                                | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `0001_extensions.sql`               | pgcrypto, pg_trgm, unaccent, pgvector, PostGIS                         |
| `0002_app_schema.sql`               | `app` schema, users, patient profiles, consents, audit logs            |
| `0003_patient_profile_identity.sql` | profile `id`, `full_name`, verified `phone`, accessibility preferences |
| `0004_audit_persistence.sql`        | audit outcome/role/source columns, checks, append-only triggers        |
| `0005_hospital_discovery.sql`       | PostGIS hospital directory, filters/indexes, default-deny RLS          |
| `0011_ocr_metadata.sql`             | OCR processing metadata for medical documents                          |
| `0012_osm_discovery.sql`            | OSM-discovered facility records (hospitals, pharmacies)                |

## Rules

- Applied migrations are immutable. The runner stores a SHA-256 checksum and refuses
  a changed file. Fix a mistake with a new migration.
- One transaction per file. A failed migration leaves no partial schema.
- No fake seed data and no clinical tables until the module's requirements, consent
  model and clinical review exist.
- Extensions are installed by migration, not by a Docker init script, so hosted
  Postgres behaves the same as local.
- `public.schema_migrations` is the only table outside `app`; it is infrastructure,
  not domain data.

Run against local Docker: `pnpm db:migrate` (reads `DATABASE_URL` from `.env`).
