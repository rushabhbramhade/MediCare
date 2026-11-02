# Provider integration strategy

Every external provider is **disabled by default**. Missing configuration produces an
explicit "not configured" state, never sample data and never a simulated success.

## Categories

| Provider         | Env prefix   | Current state                                                  |
| ---------------- | ------------ | -------------------------------------------------------------- |
| LLM              | `AI_`        | `AI_PROVIDER=disabled`; only `openai-compatible` is recognised |
| OCR              | `OCR_`       | disabled; no adapter                                           |
| Geocoding        | `GEOCODING_` | disabled; map tiles work without it                            |
| SMS              | `SMS_`       | disabled; no adapter                                           |
| Email            | `EMAIL_`     | disabled; no adapter                                           |
| Pharmacy stock   | `PHARMACY_`  | disabled; no contract                                          |
| Doctor directory | `DOCTOR_`    | disabled; no contract                                          |
| Ambulance        | `AMBULANCE_` | disabled; emergency page uses public numbers                   |

## Rules

1. **No fabricated data.** A provider outage or missing key shows a clear unavailable
   state. It never falls back to invented hospitals, doctors, stock or medical answers.
2. **Adapter boundary.** Each provider gets an interface plus one implementation and a
   factory that returns `null` when disabled. Business code depends on the interface.
3. **Provenance.** Provider-sourced records carry `source` and `observed_at`. The UI can
   then say how fresh the data is.
4. **Fail closed.** Authentication and consent checks happen before the provider call.
   A provider failure must not bypass them.
5. **Timeouts and retries.** Set connect/read timeouts. Retry only idempotent calls with
   bounded exponential backoff. Never retry a write blindly.
6. **Secrets.** Keys live in server environment only. Rotate on exposure. Do not log
   request headers or provider payloads containing patient data.
7. **Kill switch.** Setting the provider to `disabled` must stop calls without a code
   deploy. `AI_PROVIDER=disabled` is the model for this.
8. **Contract tests.** Pin the provider's response fixture in tests, and run a real
   sandbox test before launch. Mocks passing is not evidence the integration works.
9. **Data sharing.** A provider that receives patient data needs a legal basis, a data
   processing agreement and a documented minimum data set. Prefer pseudonymous ids.
10. **Health claims.** Do not print "verified", "trusted" or "certified" unless a real
    verification process backs it.

## Adding a provider

1. Write the adapter interface and a disabled implementation.
2. Add env vars to `.env.example` and the relevant schema in `@medicare/config` (or the
   Python settings).
3. Add the factory branch and tests for disabled, missing-config and success cases.
4. Add the provider's failure mode to the UI copy.
5. Update this table and `docs/requirements/scope.md`.

## Emergency path

Ambulance and emergency numbers are public information, not a provider integration.
They must remain reachable without login, without JS and without a model call.
