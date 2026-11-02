# API conventions

## Shape

- Base path `/v1`, set once with `app.setGlobalPrefix("v1")`.
- JSON only. Resource names plural, lowercase.
- OpenAPI is served at `/docs` in development and disabled when
  `NODE_ENV=production`.
- Routes and response interfaces shared with the web live in
  `packages/contracts`; request schemas live in `packages/validators`.

## Authentication

- Every route requires `Authorization: Bearer <supabase access token>` unless marked
  `@Public()`.
- Health endpoints (`GET /v1/health`, `GET /v1/health/ready`) are public and contain no
  patient data.
- `GET /v1/auth/me` returns the verified identity and application role.
- `GET|PUT|PATCH /v1/patients/me` requires the `patient` role and acts only on the
  verified subject. Request bodies never carry a user id or phone number.
- `GET /v1/hospitals` requires a verified token (any role) and is read-only.

### Patient profile

| Method | Path              | Body / result                                        |
| ------ | ----------------- | ---------------------------------------------------- |
| GET    | `/v1/patients/me` | `{ profile }`; `404 profile_not_found` when absent   |
| PUT    | `/v1/patients/me` | full profile; creates or replaces; `{ profile }`     |
| PATCH  | `/v1/patients/me` | at least one field; `{ profile }`; `404` when absent |

- `fullName` is required on `PUT`; `preferredLanguage` defaults to `en` and
  `accessibilityPreferences` to `[]`.
- `phone` is read-only and comes from the verified JWT claim. `id` is the internal
  profile id; `user_id` is never exposed.
- Bodies are strict: unknown fields, `phone` and `userId` are rejected with
  `validation_error`.
- Reads are throttled at 60/min; writes at 30/min.

### Hospital search

`GET /v1/hospitals?latitude=&longitude=&radiusKm=&specialty=&emergencyOnly=&page=&pageSize=`

- `latitude`/`longitude` required; `radiusKm` 0.5–50 (default 10); `pageSize` 1–50
  (default 20).
- `specialty` is a case-insensitive exact match; `emergencyOnly=true` keeps only rows
  the source marked as emergency-capable.
- `status` is `OK` or `NO_DATA_SOURCE_CONFIGURED`. The no-source response has
  `data: []` and `meta.source: null`; it is not an error and must not be rendered as
  zero hospitals.
- Every result has `source`, `lastSyncedAt`, `isStale` and
  `bedAvailability: "unknown"`. `hasEmergency: null` means unknown, not false.
- Database failure returns `503 hospital_search_unavailable`.

## Errors

One envelope for every failure:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "requestId": "3f0c...",
    "details": [{ "path": "phone", "message": "Invalid phone number" }]
  }
}
```

- `code` is stable and machine-readable; `message` is human-readable and safe to show.
- 5xx responses never leak stack traces or database messages.
- `requestId` matches the `x-request-id` response header and the server log.
- Status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 absent,
  409 conflict, 413 too large, 429 rate limited, 503 dependency unavailable.

## Validation

- Use `ZodValidationPipe` with a schema from `@medicare/validators`.
- Reject unknown fields where the schema says so; do not pass raw bodies to services.
- Validate path/query params too, not just bodies.

## Versioning

- `/v1` is the contract. Breaking changes require `/v2` or a documented deprecation
  window; additive fields are allowed.
- Clients must ignore unknown response fields.

## Pagination

`Paginated<T>` exists in `@medicare/types` (`items`, `nextCursor`). Hospital search is
the first paginated endpoint and uses offset pagination (`page`, `pageSize`, `total`)
because results are ordered by distance. Cursor pagination remains the default for
future feeds.

## Idempotency

Mutating endpoints that may be retried (uploads, bookings, notifications) must accept an
`Idempotency-Key` header and store the result. This is not implemented yet; do not rely
on retries being safe.

## Rate limits

Global throttle from `RATE_LIMIT_TTL_MS` / `RATE_LIMIT_LIMIT`. The auth surface is
intended to use the stricter `AUTH_RATE_LIMIT_LIMIT`. The current throttler is
per-process and in-memory; a multi-instance deployment needs a shared store.

## Calling the AI service

- Only the API calls it, with `X-Internal-Token`.
- Never expose the AI service to the browser or put it on a public load balancer.
- Treat provider failure as a failed request with an honest message; never substitute a
  canned medical answer, except the deterministic emergency response.

## Logging and audit

- Log request id, method, route, status and duration.
- Never log tokens, phone numbers, report text, prompts or model responses.
- Authenticated requests are audited to `app.audit_logs` with actor, action, outcome,
  status and sanitised metadata. Bodies and query strings are excluded.
- Profile writes are fail-closed: the audit row shares the data transaction. Reads and
  generic request events are fail-open: a failed audit write is logged and the request
  continues. See [ADR-0005](../architecture/decisions/0005-audit-persistence-and-failure-policy.md).
- There is no audit read API. Patients cannot query, edit or delete audit history.
