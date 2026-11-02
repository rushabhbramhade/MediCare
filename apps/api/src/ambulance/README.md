# Ambulance

**Status:** Deferred — foundation only

## Responsibility

Ambulance discovery and emergency request routing through licensed emergency providers.

## Data owned

- `app.ambulance_providers`
- `app.ambulance_requests` with status history

## Planned HTTP surface

- `GET /v1/ambulance/nearby`
- `POST /v1/ambulance/requests`
- `GET /v1/ambulance/requests/:id`

## Security and safety notes

A request is not a guarantee of dispatch. Show provider confirmation explicitly and keep a call-emergency-services fallback visible. Location is shared only for an active request and expires afterwards.

## Next step

Do not simulate dispatch. Integrate only with a contracted emergency provider and rehearse failure modes.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
