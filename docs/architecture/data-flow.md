# Data flow

## 1. Phone OTP sign-in

```mermaid
sequenceDiagram
    participant P as Patient (browser)
    participant W as Next.js
    participant S as Supabase Auth
    participant A as NestJS API
    P->>W: phone number
    W->>S: signInWithOtp (server action)
    S-->>P: SMS code
    P->>W: code
    W->>S: verifyOtp (server action)
    S-->>W: session cookies (HttpOnly via @supabase/ssr)
    P->>W: GET /dashboard
    W->>S: getUser() in proxy.ts
    S-->>W: verified user
    W->>A: GET /v1/auth/me + Bearer token
    A->>S: fetch JWKS
    A-->>W: { user: { id, role } }
```

- The browser never receives a service role key.
- `proxy.ts` uses `getUser()`, not `getSession()`, so the token is validated server-side.
- If Supabase env is missing, protected routes redirect to `/login`; there is no
  insecure fallback identity.

## 2. iCare symptom guidance (target flow, not wired)

```mermaid
sequenceDiagram
    participant W as Web
    participant A as NestJS API
    participant I as FastAPI AI
    participant M as Model provider
    W->>A: POST /v1/icare/symptoms (consent checked)
    A->>I: POST /v1/icare/symptoms + X-Internal-Token
    I->>I: deterministic emergency red-flag check
    alt emergency
        I-->>A: fixed escalation answer (provider not called)
    else routine
        I->>I: optional consented retrieval (patient_ref only)
        I->>M: system + user prompt (identifiers redacted)
        M-->>I: draft text
        I->>I: reject diagnosis/dosing, add disclaimer
        I-->>A: IcareAnswer
    end
    A-->>W: answer, urgency, red flags, sources
```

The AI service exists and enforces this order in `app/orchestration/pipeline.py`. The
API gateway route and the web call are not built. Until they are, the UI states that
iCare is not connected.

## 3. Report explanation

Same pipeline with `report_text`. Identifiers are redacted before the provider sees the
text. If no records are supplied, the prompt says so; the model must not imply it has
the patient's history. Output is rejected if it contains diagnosis or dosing language,
and replaced with a safe fallback.

## 4. Medical record upload (planned)

1. Web requests an upload target from the API.
2. File goes to Supabase Storage under a per-user prefix, not through the API.
3. API enqueues `document-processing`.
4. Document worker calls an OCR adapter, stores extracted text and page references,
   and marks the document `failed` if extraction fails.
5. Patient sees processing state; nothing is guessed.

No upload, storage bucket policy or worker producer is implemented in this build.

## 5. Patient profile

```mermaid
sequenceDiagram
    participant P as Patient (browser)
    participant W as Web
    participant A as NestJS API
    participant D as Postgres
    P->>W: profile form (PUT or PATCH)
    W->>A: /v1/patients/me + Bearer token
    A->>A: verify JWT, take user id and phone claim
    A->>D: BEGIN
    A->>D: upsert app.users + app.patient_profiles WHERE user_id = token sub
    A->>D: INSERT app.audit_logs
    A->>D: COMMIT
    A-->>W: { profile }
```

- The request body never supplies `userId` or `phone`; both come from the verified
  token. Unknown fields are rejected.
- `PUT` replaces the profile and creates it when absent. `PATCH` updates selected
  fields and returns `404 profile_not_found` when no row exists.
- A failed audit insert rolls the profile change back (fail-closed). Reads still
  succeed if their audit insert fails (fail-open) and log `audit_persist_failed`.

## 6. Hospital discovery

```mermaid
sequenceDiagram
    participant W as Web
    participant A as NestJS API
    participant P as Hospital provider adapter
    participant D as Postgres/PostGIS
    W->>A: GET /v1/hospitals?latitude&longitude&radiusKm
    A->>P: describe()
    alt provider not configured
        A-->>W: NO_DATA_SOURCE_CONFIGURED, data: []
    else configured
        A->>D: ST_DWithin + specialty/emergency filters
        D-->>A: verified/stale rows ordered by distance
        A-->>W: OK, rows + source/freshness meta
    end
```

- Only `verified` and `stale` rows are searchable; `unverified` rows stay hidden.
- Every row carries `source`, `lastSyncedAt`, `isStale` and
  `bedAvailability: "unknown"`. `hasEmergency: null` means the source did not verify
  emergency capability.
- With no licensed provider, the API does not query the database and does not invent
  records. This is the default state.

## 7. Audit

- `PatientsService` writes rich profile events. `AuditLogInterceptor` writes generic
  request success/failure events and skips success for `@ServiceAudited()` routes to
  avoid duplicates. `ApiExceptionFilter` writes guard-level 401/403 events once.
- `app.audit_logs` is append-only: triggers reject UPDATE, DELETE and TRUNCATE. RLS is
  default-deny for non-owner roles.
- Metadata is scrubbed of passwords, OTPs, tokens, secrets, cookies, phone, email,
  address and clinical content before insertion.
- There is no audit read API, retention policy or export yet.

## Data minimisation

- Supabase owns credentials and sessions.
- `app.users` stores only id, phone and role.
- `app.patient_profiles` stores the profile fields shown in the UI; no address,
  government id or clinical history.
- AI requests carry `patient_ref`, never phone numbers or government ids.
- Audit metadata must never contain clinical content.
