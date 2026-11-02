# Locations

**Status:** Deferred — foundation only

## Responsibility

Geospatial search primitives using PostGIS plus an optional geocoding adapter.

## Data owned

- PostGIS `geography(Point, 4326)` columns on future place tables

## Planned HTTP surface

- `GET /v1/locations/nearby?lat=&lng=&radius=` (internal helper, not a data source)

## Security and safety notes

Round coordinates in logs and analytics. Never persist a user location without a clear product need and retention limit.

## Next step

Implement after hospital/pharmacy tables exist and a licensed geocoding provider is selected.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
