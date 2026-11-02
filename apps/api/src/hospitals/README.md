# Hospitals

**Status:** Deferred — foundation only

## Responsibility

Verified hospital directory and bed-availability snapshots. Real-time availability is only shown when a contracted feed provides it.

## Data owned

- `app.hospitals` (PostGIS geography)
- `app/hospital_departments`
- `app.bed_availability_snapshots` with source and `observed_at`

## Planned HTTP surface

- `GET /v1/hospitals?lat=&lng=&radius=`
- `GET /v1/hospitals/:id`
- `GET /v1/hospitals/:id/availability`

## Security and safety notes

Never invent hospitals, bed counts or wait times. Every availability value carries its source and observation time. Public directory data is not patient data, but searches are rate-limited.

## Next step

Seed only with a verifiable source or clearly labelled development fixtures; implement the provider sync worker before live data.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
