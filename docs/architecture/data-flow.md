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

## 5. Provider discovery (planned)

Search requests go to the API, which queries a provider adapter. Responses carry
`source` and `observed_at`. Stale data is labelled stale. If no contract exists, the
API returns an explicit "not configured" state, never sample entries.

## 6. Audit

`AuditLogInterceptor` records authenticated mutating requests and logs them through
`pino` with actor id, action, resource, request id and IP. Persisting to
`app.audit_logs` is the next step; the table already exists.

## Data minimisation

- Supabase owns credentials and sessions.
- `app.users` stores only id, phone and role.
- AI requests carry `patient_ref`, never phone numbers or government ids.
- Audit metadata must never contain clinical content.
