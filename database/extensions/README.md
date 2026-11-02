# Extensions

Installed by `migrations/0001_extensions.sql`.

| Extension  | Why                                  | Used by                      |
| ---------- | ------------------------------------ | ---------------------------- |
| `pgcrypto` | `gen_random_uuid()`, hashing helpers | consents, future tokens      |
| `pg_trgm`  | fuzzy text search                    | medicine and provider search |
| `unaccent` | accent-insensitive search            | search normalisation         |
| `vector`   | pgvector embeddings                  | consented RAG retrieval      |
| `postgis`  | `geography` points and distance      | hospital/pharmacy finder     |

The local image (`infrastructure/docker/postgres/Dockerfile`) is based on
`pgvector/pgvector:pg16` with PostGIS added. A hosted Postgres must provide the same
extensions; otherwise migration `0001` fails.

Embeddings are not generated in this build. The extension is present so the retrieval
contract can be implemented without changing the database image later.
