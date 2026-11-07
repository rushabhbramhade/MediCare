# Provider integration strategy

Every external provider is **disabled by default**. Missing configuration produces an
explicit "not configured" state, never sample data and never a simulated success.

## Categories

| Provider         | Env prefix   | Current state                                                    |
| ---------------- | ------------ | ---------------------------------------------------------------- |
| Hospital         | `HOSPITAL_`  | `disabled`; interface + disabled adapter only; no vendor assumed |
| LLM              | `AI_`        | `AI_PROVIDER=disabled`; only `openai-compatible` is recognised   |
| OCR              | `OCR_`       | disabled; no adapter                                             |
| Geocoding        | `GEOCODING_` | disabled; map tiles work without it                              |
| SMS              | `SMS_`       | disabled; no adapter                                             |
| Email            | `EMAIL_`     | disabled; no adapter                                             |
| Pharmacy stock   | `PHARMACY_`  | disabled; no contract                                            |
| Doctor directory | `DOCTOR_`    | disabled; no contract                                            |
| Ambulance        | `AMBULANCE_` | disabled; emergency page uses public numbers                     |
| OSM discovery    | `OSM_`       | Overpass API for hospital/pharmacy discovery; results unverified |

## OpenStreetMap Overpass Discovery

`GET /v1/osm/hospitals` and `GET /v1/osm/pharmacies` query the public
OpenStreetMap Overpass API (`https://overpass-api.de/api/interpreter`) for
features near a point within a configurable radius.

Configuration:
- `OSM_OVERPASS_API_URL` — Overpass endpoint (default: public instance)
- `OSM_OVERPASS_TIMEOUT_SECONDS` — request timeout (default: 30s)
- `OSM_CACHE_TTL_SECONDS` — Redis cache TTL (default: 3600s)

Results carry OpenStreetMap attribution and are **never** marked verified:
- `verificationStatus: "unverified"`
- `bedAvailability: "unknown"`
- `operationalStatus: "unknown"`
- `hasEmergency: null`

OSM is not a medical directory. Results must not be represented as verified
or currently operational without independent verification.

## ABDM HPR (Doctor Discovery)

The Ayushman Bharat Digital Mission Health Professional Registry (ABDM HPR)
is the authorised source for verified doctor directories in India.

Integration requirements (not yet implemented):
1. ABDM sandbox approval and gateway access
2. Facility/professional registry API keys
3. Consent framework for practitioner data sharing
4. Verified booking links — only display when a contracted booking
   integration exists

**Do not scrape Practo or invent a Practo API.** Practo is a commercial
platform; scraping is prohibited and no Practo API integration exists.
Doctor discovery remains `disabled` until an authorised ABDM HPR integration
is approved.

## Emergency Ambulance Numbers

Public emergency numbers (not a provider integration):

| Number | Service | Notes |
|--------|---------|-------|
| 112    | India Emergency Response System | National single emergency number, all states |
| 108    | Emergency Medical Services | State-specific; available in most Indian states |

These are public information and require no login, no API key, and no
provider integration. **Do not claim to dispatch or track an ambulance**
without an authorised dispatch integration. Calling a number is not a
booking.

