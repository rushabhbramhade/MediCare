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
- Future patient-data routes must scope queries by the authenticated subject. Ownership
  checks belong in the query, not in a post-fetch `if`.

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
- Rate limiting applies globally (`RATE_LIMIT_*`), with a stricter auth limit reserved
  for the login surface.
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

- Data minimisation: no address, government id or clinical history in the foundation
  schema.
- `ENCRYPTION_KEY` is required in production by config validation but is **not yet used
  by application code**. Do not claim field-level encryption exists.
- TLS is expected at the ingress; the repository does not terminate it.
- Backups, retention and deletion workflows are not implemented.

## Database

- RLS is enabled with no policies: default-deny for Supabase client roles.
- All access goes through the API using the owner connection.
- Migrations are transactional and checksummed; editing an applied migration is refused.

## AI-specific

- Deterministic red-flag rules run before any model call.
- Provider is disabled unless fully configured; there is no fake or local fallback that
  fabricates answers.
- Identifiers are redacted before prompts. Retrieval requires consent and a
  pseudonymous reference.
- Output is screened for diagnosis/dosing language and replaced on failure.
- Prompts and responses must not be logged with patient content at info level.

## Known gaps

- Audit events are not persisted to the database yet.
- No CSRF token scheme beyond SameSite cookies; server actions rely on Next.js defaults.
- No WAF, bot protection or distributed rate limiting (in-memory throttler only).
- No antivirus/content scanning for uploads (uploads are not implemented).
- No independent penetration test, DPIA or certification.
