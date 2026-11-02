# 0002 — Raw SQL and checksummed migrations

**Status:** accepted

## Context

The data model is small but sensitive. Queries will involve PostGIS distance,
pgvector retrieval and trigram search. An ORM would hide the SQL we most need to
inspect, and generated migrations are harder to review for lock behaviour.

## Decision

- Use `pg` with parameterised SQL. No ORM.
- Schema lives in `database/migrations/NNNN_name.sql`.
- `infrastructure/scripts/migrate.mjs` applies files once, in order, in a transaction,
  under an advisory lock, and stores a SHA-256 checksum. Editing an applied migration
  stops the run.
- No seed data.

## Consequences

- Every query is explicit and reviewable.
- The team owns mapping rows to types; shared types keep the API contract stable.
- No automatic schema diffing. Reviewing SQL is mandatory, not optional.
- Migrations are not online-safe by default; large-table changes need a plan.
