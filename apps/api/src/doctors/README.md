# Doctors

**Status:** Deferred — foundation only

## Responsibility

Doctor discovery, specialties, availability and appointment booking through provider adapters.

## Data owned

- `app.doctors` (verification status + source)
- `app.doctor_specialties`
- `app.appointments`

## Planned HTTP surface

- `GET /v1/doctors?specialty=&lat=&lng=`
- `GET /v1/doctors/:id/availability`
- `POST /v1/appointments`
- `POST /v1/appointments/:id/cancel`

## Security and safety notes

Never fabricate credentials, reviews or availability. Record the verification source and timestamp. Appointment actions are idempotent and audited.

## Next step

Define the booking provider contract and verification policy before implementing.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
