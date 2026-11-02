# Milestone 2 — profile, audit and hospital discovery

This milestone ships one real vertical slice:

1. an authenticated patient profile backed by PostgreSQL;
2. a persistent, append-only audit trail with an explicit failure policy;
3. hospital discovery behind a provider boundary that stays disabled until a licensed
   source exists.

No hospital, doctor, bed count, rating or availability value is invented. `PRODUCT.md`
is unchanged.

## Identity and profile model

Supabase Auth owns credentials, OTPs, sessions and the verified phone number. Medicare
keeps a local mirror in `app.users` (`id`, `phone`, `role`) and a profile in
`app.patient_profiles`.

| Column                      | Notes                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| `user_id`                   | Primary identity link; must equal the verified JWT `sub`                     |
| `id`                        | Internal profile id, generated; never used for authentication                |
| `full_name`                 | Required, 1–120 characters                                                   |
| `date_of_birth`             | Optional date, not in the future                                             |
| `gender`                    | Optional closed set                                                          |
| `phone`                     | Populated only from the verified JWT claim, never from the body              |
| `preferred_language`        | `en` or `hi`, default `en`                                                   |
| `accessibility_preferences` | Closed set: `large_text`, `high_contrast`, `screen_reader`, `reduced_motion` |
| `created_at`, `updated_at`  | Server timestamps; updates use a trigger                                     |

`PUT` upserts the `app.users` mirror and the profile in one transaction. `PATCH` never
creates a profile. Both derive identity exclusively from the verified token. Strict Zod
schemas reject `userId`, `phone` and unknown fields, so a caller cannot write another
patient's row or override the verified number.

## Profile API

| Method | Path              | Role    | Throttle | Result                                             |
| ------ | ----------------- | ------- | -------- | -------------------------------------------------- |
| GET    | `/v1/patients/me` | patient | 60/min   | `{ profile }` or `404 profile_not_found`           |
| PUT    | `/v1/patients/me` | patient | 30/min   | `{ profile }`; creates or replaces                 |
| PATCH  | `/v1/patients/me` | patient | 30/min   | `{ profile }`; `404 profile_not_found` when absent |

`PUT` body:

```json
{
  "fullName": "Asha Rao",
  "dateOfBirth": "1990-04-12",
  "gender": "female",
  "preferredLanguage": "hi",
  "accessibilityPreferences": ["large_text"]
}
```

`fullName` is required. `preferredLanguage` defaults to `en` and
`accessibilityPreferences` to `[]`. `PATCH` accepts any subset with at least one field.
The response is a `PatientProfile` with camelCase fields; `userId` is never returned.

The web profile form uses TanStack Query, React Hook Form and the shared Zod schema. It
renders loading, empty (create), ready, save-success, save-error and session-expired
states. The phone field is read-only and labelled as coming from verified sign-in.

## Audit lifecycle

`app.audit_logs` stores actor, role, action, resource, request id, outcome, status,
duration, source and sanitised metadata. There is no actor foreign key, so rows survive
account deletion. There is no patient or admin read API.

Entry points:

| Event                     | Writer                | Notes                                            |
| ------------------------- | --------------------- | ------------------------------------------------ |
| `patient_profile.created` | `PatientsService`     | Inside the profile transaction                   |
| `patient_profile.updated` | `PatientsService`     | `PUT` replace or `PATCH`; inside the transaction |
| `patient_profile.read`    | `PatientsService`     | After a successful read                          |
| Generic request success   | `AuditLogInterceptor` | Skipped for `@ServiceAudited()` success          |
| Generic request failure   | `AuditLogInterceptor` | Recorded once with the HTTP status               |
| `auth.unauthenticated`    | `ApiExceptionFilter`  | Guard-level 401, recorded before interceptors    |
| `authz.denied`            | `ApiExceptionFilter`  | Guard-level 403                                  |

Failure policy:

- **Profile create/update: fail-closed.** The audit insert uses the same transaction.
  If it fails, the profile change rolls back and the request fails.
- **Profile read, generic request and auth failures: fail-open.** A failed insert logs
  `audit_persist_failed` and the request continues. This is a deliberate availability
  trade-off; it still needs an alert.
- **No duplicate success event:** routes marked `@ServiceAudited()` are skipped by the
  interceptor. Failures are still recorded there because a rolled-back mutation has no
  persisted service event.

Sanitisation drops keys matching password, OTP, token, secret, API key, authorization,
cookie, report, document, content, phone, email or address. Strings are capped at 256
characters, objects at 20 keys and depth 2. Request bodies and query strings are never
recorded.

Immutability: triggers reject `UPDATE`, `DELETE` and `TRUNCATE` on `app.audit_logs` for
the owner connection too. RLS is enabled with no policies. A database superuser can
still drop the trigger; this is not a write-once external sink. See
[ADR-0005](../architecture/decisions/0005-audit-persistence-and-failure-policy.md).

## Hospital discovery

`GET /v1/hospitals?latitude=&longitude=&radiusKm=&specialty=&emergencyOnly=&page=&pageSize=`

- Authenticated (any verified role), 30 requests/min.
- Required: `latitude` (-90..90), `longitude` (-180..180).
- `radiusKm` 0.5–50, default 10; `page` ≥ 1; `pageSize` 1–50, default 20.
- `specialty` is a case-insensitive exact match against `specialties`.
- `emergencyOnly=true` keeps only `has_emergency IS TRUE`. `NULL` means the source did
  not verify emergency capability and is not treated as false.
- Only `verification_status IN ('verified', 'stale')` rows are searchable.
- Ordering is straight-line PostGIS distance from the search point, then id.

Response:

```json
{
  "status": "OK",
  "data": [
    {
      "id": "…",
      "name": "…",
      "addressLine": "…",
      "city": "…",
      "state": "…",
      "postalCode": "…",
      "latitude": 19.076,
      "longitude": 72.8777,
      "distanceKm": 1.23,
      "hasEmergency": true,
      "specialties": ["cardiology"],
      "verificationStatus": "verified",
      "source": "licensed-provider",
      "lastSyncedAt": "2026-01-01T00:00:00.000Z",
      "isStale": false,
      "bedAvailability": "unknown"
    }
  ],
  "meta": {
    "source": "licensed-provider",
    "liveAvailabilitySupported": false,
    "capabilities": { "specialtyFilter": true, "emergencyFilter": true },
    "radiusKm": 10,
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "generatedAt": "2026-01-01T00:00:00.000Z",
    "maxStalenessHours": 24
  }
}
```

No-source response (the default):

```json
{
  "status": "NO_DATA_SOURCE_CONFIGURED",
  "data": [],
  "meta": {
    "source": null,
    "liveAvailabilitySupported": false,
    "capabilities": { "specialtyFilter": false, "emergencyFilter": false },
    "radiusKm": 10,
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "generatedAt": "…",
    "maxStalenessHours": null
  }
}
```

The API does not query the database in this case. The UI renders a no-source notice and
an empty state, not "0 hospitals found".

`app.hospitals` stores no bed or ICU columns. `bedAvailability` is always `"unknown"`.
`isStale` is true when the row is marked `stale` or when `last_synced_at` is older than
the provider's declared `maxStalenessHours`. Database failures return
`503 hospital_search_unavailable`; there is no cached or invented fallback.

## Provider boundary

`HospitalProvider.describe()` returns:

- `configured` — false means no usable contract or credentials;
- capabilities (search, specialty/emergency filters, live bed availability);
- provenance (`source`, `license`);
- sync strategy and freshness window.

Only `DisabledHospitalProvider` exists. `HOSPITAL_PROVIDER=disabled` is accepted; any
other value logs `hospital_provider_not_implemented; staying disabled`. A typo cannot
activate a fake feed. `HOSPITAL_API_URL`, `HOSPITAL_API_KEY` and
`HOSPITAL_DATA_MAX_AGE_HOURS` are reserved for a future adapter and are not called by
current code.

## Migrations

| Migration                           | What it does                                                           |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `0003_patient_profile_identity.sql` | adds profile id, full name, phone, accessibility; renames display name |
| `0004_audit_persistence.sql`        | adds audit columns/checks, indexes, append-only triggers               |
| `0005_hospital_discovery.sql`       | creates PostGIS hospital table, indexes and RLS                        |

Apply with:

```bash
pnpm db:migrate
```

The runner is checksummed and transactional. Re-running after success is a no-op; never
edit an applied migration.

## Verification commands

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm ai:test
```

Live PostgreSQL integration tests are skipped unless `DATABASE_URL` is present. Turbo
does not forward the variable in this repository's current task config, so run the API
package directly:

```bash
DATABASE_URL='postgresql://medicare:medicare_local_only@localhost:5432/medicare' \
  pnpm --filter @medicare/api test
```

That suite proves profile create/read/update, patient isolation, append-only audit
rejection, PostGIS ordering/filtering/pagination, and the no-source path against a real
migrated database. Without `DATABASE_URL`, those five tests are skipped, not faked.

## Environment

| Variable                      | Default    | Purpose                                                       |
| ----------------------------- | ---------- | ------------------------------------------------------------- |
| `HOSPITAL_PROVIDER`           | `disabled` | Only `disabled` is implemented                                |
| `HOSPITAL_API_URL`            | empty      | Reserved for a future licensed adapter                        |
| `HOSPITAL_API_KEY`            | empty      | Reserved; server-only                                         |
| `HOSPITAL_DATA_MAX_AGE_HOURS` | `24`       | Reserved freshness window; the disabled adapter declares none |

Existing required variables (`DATABASE_URL`, JWT settings, Redis, CORS) are unchanged.

## Honest limits

- End-to-end browser sign-in was not exercised because no real Supabase project/JWKS is
  configured. The API integration suite uses real Postgres; the controller e2e suite
  stubs token verification. No claim of a live authenticated browser flow is made.
- Web tests are state/logic tests (Vitest, node environment), not DOM rendering tests.
- No hospital provider is enabled, so live hospital data is not verified.
- No audit read/export/retention, no alerting, no external write-once sink.
- No caregiver access, consent UI, account deletion or record upload.

## Next milestone

Connect a licensed hospital or doctor source behind the existing adapter, add a sync
worker and contract tests, then add caregiver consent and an admin audit read path.
