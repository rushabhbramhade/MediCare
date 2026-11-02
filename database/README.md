# Database

Postgres is the system of record. Supabase Auth is the identity provider; it is not a
second application database.

- `migrations/` — ordered, immutable SQL applied by the migration runner.
- `seeds/` — intentionally empty. See `seeds/README.md`.
- `extensions/` — notes on the Postgres extensions and why they exist.
- `functions/` — notes on database functions and triggers.
- `policies/` — row-level security plan and current default-deny posture.
- `diagrams/` — domain map.

Connection string: `DATABASE_URL`. The API and workers use a direct `pg` connection;
the browser never talks to Postgres.

Start local infrastructure with `pnpm db:up`, apply schema with `pnpm db:migrate`.
