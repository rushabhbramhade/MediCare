# Postgres 16 + pgvector + PostGIS for local development.
#
# pgvector is already in the base image. PostGIS comes from the PostgreSQL APT
# repository that the official image enables.
FROM pgvector/pgvector:pg16

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-16-postgis-3 \
        postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*

# Extensions and schema are created by database/migrations, not by init scripts,
# so the same migrations run against hosted Postgres.
