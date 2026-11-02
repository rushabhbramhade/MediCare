# Medicines

**Status:** Deferred — foundation only

## Responsibility

Medicine master data and ingredient search (pg_trgm + unaccent). Does not provide dosing advice.

## Data owned

- `app.medicines`
- `app.ingredients`
- `app.medicine_ingredients`

## Planned HTTP surface

- `GET /v1/medicines?q=`
- `GET /v1/medicines/:id`

## Security and safety notes

Search results carry source attribution. Never infer prescriptions, dosage or interactions without a licensed data source.

## Next step

Select a licensed Indian medicine dataset; implement search and import tooling.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
