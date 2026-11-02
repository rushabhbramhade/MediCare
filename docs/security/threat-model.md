# Threat model

Assets: patient identity, contact details, medical documents, report text, AI prompts and
responses, consent records, audit logs, provider credentials.

Actors: unauthenticated internet, authenticated patient, caregiver, malicious insider,
compromised dependency, abusive client, attacker who obtains a token.

| #   | Threat                                   | Impact                         | Current mitigation                                                                        | Gap                                                                          |
| --- | ---------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Stolen bearer token                      | Account takeover               | Short-lived Supabase tokens, server-side `getUser()`, TLS expected                        | No device binding, no step-up auth, no refresh-token revocation UI           |
| 2   | IDOR on patient data                     | Data breach                    | No patient-data endpoints yet; future rule is subject-scoped queries                      | Not testable until endpoints exist                                           |
| 3   | Consent bypass in AI retrieval           | Unauthorised record use        | `consent_granted` + `patient_ref` required; retriever is null; failure returns no records | No end-to-end consent check at the API gateway yet                           |
| 4   | Prompt injection via report text/records | Harmful or exfiltration output | Fixed prompts, output validation, redaction, no tool access                               | Injection can still steer tone/content; no dedicated adversarial suite       |
| 5   | Model fabricates diagnosis or dose       | Patient harm                   | Deterministic red flags, diagnosis/dosing detection, safe fallback, disclaimer            | Rules are heuristic and not clinically reviewed                              |
| 6   | Provider outage or missing key           | Silent fake answers            | Provider disabled by default; pipeline raises unavailable                                 | No circuit breaker or user-facing retry guidance yet                         |
| 7   | Committed secret                         | Credential compromise          | `.env` ignored, `check:secrets`, examples contain placeholders                            | No GitHub secret scanning configuration or rotation runbook                  |
| 8   | Service token leak                       | Direct AI access               | HMAC compare, 503 when unset, internal network expected                                   | Shared static token; no rotation or per-caller identity                      |
| 9   | SQL injection                            | Data breach                    | Parameterised `pg` queries, no string-built SQL                                           | Raw SQL requires discipline; no query linting                                |
| 10  | Injection into Postgres search           | Data leak / DoS                | No search implementation yet                                                              | Add parameterised queries and statement timeouts                             |
| 11  | Brute-force OTP                          | Account takeover / SMS cost    | Stricter auth throttle reserved; Supabase rate limits                                     | Auth throttle value not separately applied in code yet                       |
| 12  | Enumeration via errors                   | Leak of account existence      | Generic 5xx, stable error codes                                                           | Auth errors may still reveal whether a number exists (Supabase behaviour)    |
| 13  | Log leakage of health data               | Privacy breach                 | Logging excludes bodies/tokens by policy; pino redaction not configured                   | Enforce redaction keys and test it                                           |
| 14  | Malicious upload                         | Malware / stored XSS           | Uploads not implemented                                                                   | Add MIME sniffing, size limits, malware scan, isolated storage               |
| 15  | Dependency compromise                    | Code execution                 | Lockfile, pinned ranges, CI install                                                       | No Dependabot/renovate or SBOM                                               |
| 16  | DoS                                      | Unavailability                 | Helmet, rate limit, timeouts                                                              | In-memory throttle is per process; no WAF or body-size limit beyond defaults |
| 17  | Audit tampering                          | No accountability              | Append-only intent, no update endpoint                                                    | Logs are not persisted yet; DB owner can modify                              |
| 18  | Backup loss                              | Permanent data loss            | Named Docker volume locally                                                               | No production backup/restore or tested RPO/RTO                               |
| 19  | Insider access to DB                     | Mass data exposure             | Owner-only connection, no direct client access                                            | No per-service DB roles, no query auditing                                   |
| 20  | AI data sent to third party              | Unlawful processing            | Provider disabled; redaction; minimum data                                                | No DPA, retention terms or regional routing review                           |

## Highest-priority work

1. Persist audit logs and make them append-only for the app role.
2. Separate database roles: migrations, app runtime, read-only analytics.
3. Wire the API gateway with consent checks and add IDOR tests.
4. Configure pino redaction and test that report text never reaches logs.
5. Add upload scanning before enabling records.
6. Get clinical and legal review before any model output reaches a patient.

## Out of scope here

Physical security, cloud account compromise, nation-state attackers and supply-chain
attacks on the model provider are not analysed. This is a working threat model, not a
certification.
