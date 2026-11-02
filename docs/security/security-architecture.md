# Security architecture

Health data is sensitive. The defaults here are fail-closed, and missing configuration
is an error rather than a bypass.

## Identity and sessions

- Supabase Auth owns phone OTP, sessions, refresh and revocation. Medicare never stores
  passwords or OTPs.
- The web app uses `@supabase/ssr` cookies. `proxy.ts` validates with `auth.getUser()`
  on every request to a protected path and redirects unauthenticated users to `/login`.
- The API verifies the bearer token against the project JWKS (`jwks-rsa`), checks the
  issuer and audience, and maps claims to an application role.
- No development "skip auth" flag exists. If auth env is absent, protected routes are
  inaccessible.

## Authorisation

- Global guards run in order: throttle, authenticate, roles.
- `@Public()` is an explicit opt-out used only by health endpoints.
- `@Roles()` restricts by application role; role comes from verified claims, never from
  a request body.
- Patient routes scope queries by the authenticated subject. Ownership checks belong in
  the query, not in a post-fetch `if`.
- `GET|PUT|PATCH /v1/patients/me` derive `user_id` only from the verified JWT `sub`.
  The request body cannot set `userId` or `phone`; strict schemas reject both.
- `GET /v1/hospitals` is read-only and returns public directory fields. It requires a
  verified token but no patient role.

## Service-to-service

- The AI service is internal. `/v1/icare/*` requires `X-Internal-Token`, compared with
  `hmac.compare_digest`.
- If `INTERNAL_SERVICE_TOKEN` is unset, those endpoints return 503, not open access.
- The token is shared secret configuration, not a substitute for network isolation.
  Keep the AI service off the public internet.

## Transport and browser

- Helmet sets security headers on the API; `next.config.ts` sets them for the web app.
- CORS is an explicit origin list from `API_CORS_ORIGINS`, credentials enabled, limited
  methods and headers.
- Rate limiting applies globally (`RATE_LIMIT_*`). API auth routes use
  `AUTH_RATE_LIMIT_LIMIT` via `AuthRateLimitGuard`; the web OTP send/verify server
  actions apply the same limit per phone and IP. See [authentication.md](authentication.md).
- The browser only ever holds the Supabase anon key and the user session.

## Secrets

- `.env` is gitignored; only `.env.example` is committed.
- `pnpm check:secrets` scans staged/untracked files for private keys, cloud tokens,
  JWTs and committed env files.
- Never prefix a service role key with `NEXT_PUBLIC_`. Anything with that prefix is
  shipped to the browser.
- Rotate a leaked credential before removing it from history; history rewrites do not
  un-leak it.

## Data protection

- Data minimisation: the patient profile stores name, date of birth, gender, language,
  accessibility preferences and a verified phone. No address, government id or clinical
  history is stored.
- Phone numbers are never accepted from clients; the profile copies the verified JWT
  claim. Hospital responses contain directory data only.
- `ENCRYPTION_KEY` is required in production by config validation but is **not yet used
  by application code**. Do not claim field-level encryption exists.
- TLS is expected at the ingress; the repository does not terminate it.
- Backups, retention and deletion workflows are not implemented.

## Database

- RLS is enabled with no policies: default-deny for Supabase client roles on users,
  profiles, consents, audit logs and hospitals.
- All access goes through the API using the owner connection.
- Migrations are transactional and checksummed; editing an applied migration is refused.
- `app.audit_logs` is append-only: triggers reject `UPDATE`, `DELETE` and `TRUNCATE` for
  the owner connection too. Audit metadata is scrubbed before insert. A superuser can
  still drop the trigger, so this is not write-once storage.

## Audit

- Profile create/update writes a rich service event inside the data transaction
  (fail-closed). Profile reads and generic request events use fail-open persistence: a
  failed audit write is logged but does not block the request.
- Guard-level `401`/`403` events are written once by the exception filter. Generic
  success events are skipped on `@ServiceAudited()` routes to avoid duplicates.
- No actor foreign key: rows survive account deletion. There is no read, export or
  retention API, so patients cannot read, modify or delete audit history.

## AI-specific

- Deterministic red-flag rules run before any model call.
- Provider is disabled unless fully configured; there is no fake or local fallback that
  fabricates answers.
- Identifiers are redacted before prompts. Retrieval requires consent and a
  pseudonymous reference.
- Output is screened for diagnosis/dosing language and replaced on failure.
- Prompts and responses must not be logged with patient content at info level.

## Known gaps

- Audit persistence is fail-open for reads and generic requests; a database outage can
  drop those events. Alerting on `audit_persist_failed` is not configured.
- Audit has no retention, export, admin read API or external write-once sink. A database
  superuser can disable the append-only trigger.
- No CSRF token scheme beyond SameSite cookies; server actions rely on Next.js defaults.
- No WAF, bot protection or distributed rate limiting (in-memory throttler only).
- No antivirus/content scanning for uploads (uploads are not implemented).
- No independent penetration test, DPIA or certification.
