# Pharmacies

**Status:** Deferred — foundation only

## Responsibility

Pharmacy directory and inventory snapshots sourced from partner integrations.

## Data owned

- `app.pharmacies` (PostGIS geography)
- `app.pharmacy_inventory` with `source` and `synced_at`

## Planned HTTP surface

- `GET /v1/pharmacies?lat=&lng=`
- `GET /v1/pharmacies/:id/inventory?medicineId=`

## Security and safety notes

Never claim stock without a source timestamp. Partner credentials stay in the provider registry, never in the database.

## Next step

Implement the inventory-sync worker contract once a pharmacy partner is signed.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
