# Database conventions

## Schemas

- `app` — all application tables.
- `public` — only `schema_migrations`. Extensions install into their default schemas.
- Supabase `auth` and `storage` are managed by Supabase; never copy credentials out of
  them.

## Naming

- snake_case for tables, columns, indexes, constraints and functions.
- Tables plural (`users`, `consents`); join tables `<a>_<b>`.
- Indexes `<table>_<columns>_idx`; constraints `<table>_<rule>` (for example
  `consents_active_user_idx`).

## Keys and time

- Primary keys: `uuid` with `gen_random_uuid()` for externally referenced rows;
  `bigint GENERATED ALWAYS AS IDENTITY` for append-only logs.
- `created_at timestamptz NOT NULL DEFAULT now()` on every table.
- `updated_at` plus the `app.set_updated_at()` trigger on mutable rows only.
- Store UTC; render in the user's timezone in the client.

## Types

- `text` + `CHECK` for small closed sets instead of Postgres enums. Adding a value is a
  constraint change, not `ALTER TYPE`, and reads stay plain strings.
- `timestamptz`, never `timestamp`.
- `jsonb` only for genuinely open metadata (audit metadata), never for fields that need
  querying or constraints.
- Money: `numeric(12,2)` plus a currency column when billing exists. Never `float`.
- Phone numbers: E.164 `text`. Validate at the edge.

## Deletion

- Consent and audit records are not deleted. Revoke consent with `revoked_at`; keep
  audit logs after account deletion (no actor foreign key).
- No soft-delete column by default. A clinical deletion workflow must be designed
  explicitly, with retention and legal review.

## Row-level security

- Default-deny: RLS enabled, no policies.
- The API connects as owner and enforces authorization in code.
- Any future direct client access needs policies tested as the `authenticated` role,
  including consent checks, not only `auth.uid() = user_id`.

## Indexes

- Add an index only for a known query. Every index costs writes.
- Partial indexes for active rows (see `consents_active_user_idx`).
- Use `EXPLAIN (ANALYZE, BUFFERS)` against realistic volume before claiming a query is
  fast.

## Migrations

- Files are `NNNN_name.sql`, ordered, immutable, one transaction each.
- Applied files are checksummed. To change behaviour, add a new migration.
- No seed data. Test fixtures stay out of shared environments.
- Avoid long locks on large tables: add columns nullable, backfill in batches, then add
  constraints.
- Test the migration against the real Postgres image with every required extension.

## Search

`pg_trgm` and `unaccent` are installed for medicine/provider search. `pgvector` is for
consented retrieval. `postgis` is for distance queries. None are used by application
code yet.
