# Hospitals

**Status:** Implemented — search over verified records, provider disabled by default

## Responsibility

Search a PostGIS directory of hospitals supplied by a licensed provider. The module
does not invent hospitals, distances, ratings, bed counts or ICU availability.

## Data owned

- `app.hospitals` — provider, external id, name, address, PostGIS `location`,
  `has_emergency`, `specialties`, `verification_status`, `last_synced_at`

There are deliberately no bed or ICU columns. Rows enter the table through a provider
sync, not through seeds.

## HTTP surface

`GET /v1/hospitals?latitude=&longitude=&radiusKm=&specialty=&emergencyOnly=&page=&pageSize=`

- Authenticated (any verified role), 30 requests/min.
- `latitude` and `longitude` are required; `radiusKm` 0.5–50 (default 10);
  `pageSize` 1–50 (default 20).
- Only `verified` and `stale` rows are searchable. `unverified` rows stay hidden.
- `specialty` is a case-insensitive exact match against the specialties array.
- `emergencyOnly=true` keeps only rows with `has_emergency = true`; `NULL` means the
  provider did not verify emergency capability and is not treated as false.
- Results are ordered by straight-line distance, then id.

Response status is `OK` or `NO_DATA_SOURCE_CONFIGURED`. In the no-source case `data` is
empty, `meta.source` is `null`, and the database is not queried. Every hospital carries
`source`, `lastSyncedAt`, `isStale` and `bedAvailability: "unknown"`.

## Provider boundary

`providers/hospital-provider.ts` defines the adapter interface and descriptor
(configured, capabilities, provenance, freshness window).
`providers/disabled-hospital-provider.ts` is the only implementation. Setting
`HOSPITAL_PROVIDER` to anything else logs a warning and stays disabled, so a typo cannot
enable a fake feed.

## Security and safety notes

Coordinates are parameterised into PostGIS queries. Database failures return
`503 hospital_search_unavailable`; they never fall back to cached or invented results.
RLS is enabled with no policies, so only the API's owner connection can read the table.
See [Milestone 2 notes](../../../../docs/features/milestone-2.md) and the provider
strategy in [docs/integrations](../../../../docs/integrations/provider-integration-strategy.md).
