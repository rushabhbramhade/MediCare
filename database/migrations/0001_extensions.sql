-- 0001_extensions.sql
--
-- Extensions required by planned Medicare features. They are installed up front
-- so the database image and hosted Postgres agree on capabilities before any
-- feature depends on them.
--
-- If your hosted Postgres cannot install one of these, the migration fails
-- loudly. Do not skip an extension and let a feature degrade at runtime.

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), digest helpers
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy medicine / provider search
CREATE EXTENSION IF NOT EXISTS unaccent;   -- accent-insensitive search
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector, for consented RAG retrieval
CREATE EXTENSION IF NOT EXISTS postgis;    -- geography types for hospitals/pharmacies
