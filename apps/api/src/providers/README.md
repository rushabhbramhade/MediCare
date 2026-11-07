# Providers

**Status:** Boundary defined; hospital adapter implemented as `disabled`;
OSM Overpass discovery available for hospital/pharmacy lookup.

## Responsibility

Integration registry and adapter contracts for hospital, pharmacy, doctor and ambulance
partners. Each domain owns its adapter under `<module>/providers/`; this folder documents
the shared rules.

## Current state

| Provider  | Env prefix   | State                                                 |
| --------- | ------------ | ----------------------------------------------------- |
| Hospital  | `HOSPITAL_`  | `disabled`; interface + disabled implementation only  |
| Pharmacy  | `PHARMACY_`  | disabled; no contract                                 |
| Doctor    | `DOCTOR_`    | disabled; no contract                                 |
| Ambulance | `AMBULANCE_` | disabled; public emergency numbers are not a provider |
| OSM       | `OSM_`       | Overpass API discovery (hospital/pharmacy, unverified)|

The hospital factory accepts only `HOSPITAL_PROVIDER=disabled`. Any other value logs
`hospital_provider_not_implemented; staying disabled` and returns the disabled adapter.
`HOSPITAL_API_URL`, `HOSPITAL_API_KEY` and `HOSPITAL_DATA_MAX_AGE_HOURS` are reserved for
a future adapter; no current code calls a vendor.

OSM Overpass discovery is available via `GET /v1/osm/hospitals` and
`GET /v1/osm/pharmacies`. Results are cached in Redis and carry OpenStreetMap
attribution. All results are `verificationStatus: "unverified"` and must not
be represented as verified medical facilities.

## Rules

- No fabricated records, availability, ratings or distances.
- Business code depends on the interface, never a vendor SDK.
- Responses carry `source`, `lastSyncedAt` and freshness; unknown values stay unknown.
- Provider failure returns an explicit unavailable state, never a fallback dataset.
- Credentials live in server environment only and are never logged.
- OSM results are never marked verified; bed/ICU availability stays `unknown`.

## Next step

Implement one real adapter against a licensed sandbox, with contract fixtures, timeout,
kill switch and a sync worker. Update this table and the provider strategy first.

See [docs/integrations/provider-integration-strategy.md](../../../../docs/integrations/provider-integration-strategy.md).
