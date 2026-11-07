# Ambulance emergency numbers

**Status:** Implemented — public emergency numbers only, no dispatch integration.

## Responsibility

Provide public emergency contact numbers (112 national, 108 state-specific ambulance).
These are public information and require no authentication, no API key and no
provider integration.

## Data owned

None — numbers are hardcoded public information from the Government of India.

## Planned HTTP surface

- `GET /v1/ambulance/emergency-numbers` — public, returns emergency numbers

## Security and safety notes

- A phone number is not an ambulance booking. Medicare does not dispatch or track ambulances.
- No simulated dispatch is ever shown.
- 108 operates in many states but not everywhere; if it does not connect, call 112.
- This page is general guidance, not medical advice.

## Environment variables

None required.
