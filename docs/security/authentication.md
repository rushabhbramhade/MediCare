# Authentication

Supabase Auth is the source of truth for identity, phone OTP and sessions. Medicare
does not generate, store or verify OTPs itself. The API verifies Supabase access tokens
and authorises requests; PostgreSQL stores only application data keyed by the verified
Supabase user id.

## 1. Supabase project setup

1. Create a Supabase project (or use the local stack from `infrastructure/compose`).
2. **Authentication → Providers → Phone**: enable phone auth.
3. Configure an SMS provider in **Authentication → Providers → Phone → SMS**. Supabase
   will not deliver codes without one. For India, check DLT registration and sender
   requirements with the SMS provider before going live.
4. **Authentication → URL Configuration**: add the web origins (local:
   `http://localhost:3000`, production: the real HTTPS origin). No `/auth/callback`
   redirect is needed for the OTP flow because verification happens server-side in a
   Next.js server action.
5. **Authentication → Rate Limits**: keep Supabase's own OTP limits enabled. They are a
   second layer behind the application limits below.
6. Copy the project URL, the **anon/publishable** key and the **service_role/secret**
   key from **Project Settings → API**.

The project must sign access tokens with an asymmetric key (RS256/ES256) so the API can
verify them against the JWKS endpoint. The legacy `anon` / `service_role` JWT keys and
the newer publishable / secret keys both work; only the anon/publishable key may reach
the browser.

## 2. Environment variables

Root `.env` (server-side: API, workers, migrations):

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

JWT_ISSUER=
JWT_AUDIENCE=authenticated
JWT_JWKS_URL=

AUTH_RATE_LIMIT_LIMIT=10
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_LIMIT=100
```

`apps/web/.env.local` (Next.js):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AUTH_RATE_LIMIT_LIMIT=10
```

- `JWT_ISSUER` is `<SUPABASE_URL>/auth/v1`.
- `JWT_JWKS_URL` is `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It is not read by application code yet
  and must never be given a `NEXT_PUBLIC_` prefix.
- `AUTH_RATE_LIMIT_LIMIT` is enforced on API auth routes and on the web OTP server
  actions.
- Environment files are gitignored. Only `.env.example` files are committed; run
  `pnpm check:secrets` before committing.

The API validates `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_JWKS_URL`, `DATABASE_URL`,
`REDIS_URL`, `API_CORS_ORIGINS` and the rate-limit values at boot and exits with a field
list if they are invalid. The web app validates public variables at build/start; if the
Supabase public pair is absent, the login screen shows a configuration notice and
protected routes redirect to `/login` instead of failing open.

## 3. Local development

- Local Supabase prints its URL and keys (usually `http://127.0.0.1:54321`). Point
  `SUPABASE_URL`, the JWT variables and `NEXT_PUBLIC_SUPABASE_URL` at it.
- The `.env.example` JWT defaults are the standard local Supabase values.
- Hosted and local projects are selected only by configuration; no project URL is
  hardcoded in application code.
- Local SMS delivery requires a local SMS provider or test OTPs. Supabase's local
  inbox, when enabled, shows messages without sending real SMS.

## 4. Phone OTP configuration and frontend flow

Routes and screens:

| Route        | Purpose                                                       |
| ------------ | ------------------------------------------------------------- |
| `/login`     | Enter a phone number, then verify the code in the same screen |
| `/register`  | Same flow; Supabase creates the user on first verification    |
| `/logout`    | _Server action_ `signOutAction`, used by POST forms (no URL)  |
| `/dashboard` | Authenticated landing page after verification                 |

The OTP request and verification are server actions in
`apps/web/src/features/auth/actions.ts`; no OTP ever touches browser logs or URLs.

Flow:

1. User enters a mobile number. `loginSchema` normalises common Indian formats
   (spaces, `+91`, `91`, leading `0`) to E.164 and accepts `+91[6-9]XXXXXXXXX` only.
2. `sendOtpAction` applies the phone/IP rate limit and calls
   `supabase.auth.signInWithOtp({ shouldCreateUser: true })`.
3. The UI shows the verification step and starts a 30-second resend cooldown. It says a
   code was sent only after Supabase returns success.
4. `verifyOtpAction` applies a separate rate limit and calls
   `supabase.auth.verifyOtp({ type: "sms" })`. `@supabase/ssr` writes the session
   cookies; the action then redirects to `/dashboard`.
5. Invalid/expired codes show a generic retry message. Provider errors are logged
   without the code or tokens.
6. `proxy.ts` validates the session cookie with `auth.getUser()` on every protected
   path and redirects unauthenticated users to `/login`.

A separate `/verify-otp` URL and `/auth/callback` route are not used. Verification is a
step within the login screen, so there is no phone number in the URL and no redirect
exchange to secure.

## 5. Backend JWT verification

`apps/api/src/auth/services/auth.service.ts`:

- Fetches the signing key by `kid` from `JWT_JWKS_URL` (`jwks-rsa`, cached 10 minutes)
  so key rotation is handled without a restart.
- Verifies the signature with RS256/ES256 and rejects `alg: none`.
- Verifies `iss`, `aud` and `exp`.
- Requires a non-empty `sub`; the subject is the only accepted user identity.
- Maps `app_metadata.role` to an application role. `user_metadata` is user-writable and
  is never trusted. Unknown or missing roles fall back to `patient`.
- Returns one generic 401 message; verifier details and tokens are never echoed.

Guards run in this order: global throttler → `SupabaseAuthGuard` → `RolesGuard`.
`@Public()` is used only by health routes. `@Roles(...)` restricts a route to the listed
roles; `platform_admin` passes every role check. Request bodies cannot set `userId`,
`phone` or `role`.

`GET /v1/auth/me` returns `{ user: { id, role, phone?, email? } }` from verified claims.

## 6. Patient profile

- `app.users.id` is the Supabase `auth.users.id`; no second identity table is created.
- `app.patient_profiles` has an internal `id`, a unique `user_id` foreign key, and the
  optional profile fields (`full_name`, `date_of_birth`, `gender`, `phone`,
  `preferred_language`, `accessibility_preferences`).
- `phone` is copied only from the verified JWT claim. It is never accepted from a
  request body.
- `PUT /v1/patients/me` creates or replaces the profile (`ON CONFLICT (user_id)`), so
  repeated submissions and concurrent first logins are safe. `PATCH` updates only the
  supplied fields.
- The profile is created on the first profile save, not silently at OTP verification,
  because `full_name` is required and the application does not invent personal data.
  `GET` returns `404 profile_not_found` until then; the UI shows the empty form.
- Every profile query is scoped by the verified `sub`; one patient cannot address
  another patient's row.

## 7. Roles and permissions

| Role                 | Intended use                                     |
| -------------------- | ------------------------------------------------ |
| `patient`            | Own profile and patient-facing features          |
| `caregiver`          | Delegated access (consent flow not built yet)    |
| `doctor`             | Clinical workflows (not built yet)               |
| `hospital_admin`     | Hospital administration (not built yet)          |
| `ambulance_provider` | Ambulance operations (not built yet)             |
| `pharmacy_admin`     | Pharmacy operations (not built yet)              |
| `platform_admin`     | Platform administration; passes every role check |

Roles live in Supabase `app_metadata.role` (admin-writable), never
`user_metadata.role`. There is no self-service role endpoint. Assign roles through the
Supabase dashboard, the service-role Admin API from a trusted server job, or SQL run by
an operator. Migration `0006_auth_roles.sql` keeps the database constraint aligned and
preserves historical audit role values.

Authorization for future modules should use `@Roles(...)` and scope every query by the
verified subject or an explicit, consented relationship.

## 8. Row Level Security

RLS is enabled on `app.users`, `app.patient_profiles`, `app.consents`, `app.audit_logs`
and `app.hospitals` with **no policies** — default-deny for `anon` and `authenticated`.

All patient data access goes through the NestJS API, which connects as the table owner
and enforces identity, role and ownership in code. The browser never receives a
database credential, so there is no direct PostgREST path to expose.

If direct PostgREST access is ever approved, add and test policies before granting table
access:

```sql
-- Example only; not applied. auth.uid() exists on Supabase, not on the local stack.
CREATE POLICY patient_profiles_self ON app.patient_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

Do not add an `UPDATE` policy that lets users change `user_id`; do not grant
`platform_admin` through client-writable metadata. Never expose `app.audit_logs`.
Test policies as the `authenticated` role, not as the owner.

## 9. Rate limiting and audit

- Global API throttle: `RATE_LIMIT_LIMIT` per `RATE_LIMIT_TTL_MS`.
- Auth routes: `AuthRateLimitGuard` uses `AUTH_RATE_LIMIT_LIMIT` per window, keyed by
  verified subject (or IP before authentication).
- Web OTP request and verification actions each use `AUTH_RATE_LIMIT_LIMIT` per minute
  per phone and per caller IP. The resend button also has a 30-second cooldown.
- Supabase's own OTP limits remain the upstream protection.
- `429` responses, `401` auth failures and `403` authorisation failures are written to
  the append-only audit log. OTPs, tokens, phone numbers and request bodies are never
  written to the audit metadata or application logs.

## 10. Production checklist

- [ ] Hosted Supabase project uses asymmetric JWT signing keys; JWKS reachable from the
      API network.
- [ ] Phone provider configured, sender/DLT approved, and test messages received on
      Airtel/Jio/Vi.
- [ ] Production `NEXT_PUBLIC_SUPABASE_URL` / anon key set in the web deployment only.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` present only in server-side secret storage.
- [ ] `API_CORS_ORIGINS` is the exact HTTPS web origin, not a wildcard.
- [ ] `AUTH_RATE_LIMIT_LIMIT` and Supabase OTP limits reviewed together.
- [ ] A shared rate-limit store is in place if the API or web runs more than one replica.
- [ ] `NODE_ENV=production`, `ENCRYPTION_KEY` set, Swagger disabled by the ingress.
- [ ] TLS terminated before the API/web; secure cookies enabled by the hosting platform.
- [ ] Database migrations applied and RLS still enabled with no unintended policies.
- [ ] Backups, retention and audit export reviewed.
- [ ] `pnpm check:secrets`, tests, lint, typecheck and builds pass.

## 11. Known limitations and external costs

- SMS delivery is billed by the chosen provider and may require DLT registration in
  India. Supabase's phone auth has its own pricing and quotas.
- Rate limits are in-memory per process. Multiple replicas need Redis or another shared
  counter for a global limit.
- There is no CSRF token beyond SameSite cookies; server actions rely on Next.js's
  built-in protections.
- There is no account-deletion, session-revocation UI, MFA, or recovery-email flow yet.
  Supabase admin tooling handles them manually.
- `SUPABASE_SERVICE_ROLE_KEY` is configured but no current feature uses it. Do not add
  browser access to it.
- Caregiver, doctor, hospital, ambulance and pharmacy authorisation rules are role
  foundations only; their modules and consent checks are not implemented.
- Audit persistence is fail-open for reads, and a database superuser can disable the
  append-only triggers. No external write-once sink exists.
- No independent penetration test or DPIA has been completed.
