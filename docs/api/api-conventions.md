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

`Paginated<T>` exists in `@medicare/types` (`items`, `nextCursor`). Cursor pagination is
the default choice; no paginated endpoint is implemented yet.

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
- Mutating authenticated requests are audit-logged; persistence to `app.audit_logs` is
  pending.
