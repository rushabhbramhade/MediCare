# Domain map

Implemented: users, profiles, consents, audit logs, hospitals. The hospital table has no
bed/ICU columns and no seed data.

```mermaid
erDiagram
    USERS ||--o| PATIENT_PROFILES : "has"
    USERS ||--o{ CONSENTS : "grants"
    USERS ||--o{ AUDIT_LOGS : "acts (no FK)"

    USERS {
        uuid id PK "Supabase auth id"
        text phone
        text role "application role"
        timestamptz created_at
        timestamptz updated_at
    }

    PATIENT_PROFILES {
        uuid user_id PK "identity link"
        uuid id "internal profile id"
        text full_name
        date date_of_birth
        text gender
        text phone "from verified claim only"
        text preferred_language "en|hi"
        text_array accessibility_preferences
        timestamptz created_at
        timestamptz updated_at
    }

    CONSENTS {
        uuid id PK
        uuid user_id FK
        text purpose "icare|record_processing|caregiver_access|provider_sharing"
        text document_version
        timestamptz granted_at
        timestamptz revoked_at
    }

    AUDIT_LOGS {
        bigint id PK
        uuid actor_id
        text actor_role
        text action
        text resource_type
        text resource_id
        text request_id
        text outcome "success|failure"
        integer status_code
        integer duration_ms
        text source
        jsonb metadata "sanitised"
        timestamptz created_at
    }

    HOSPITALS {
        uuid id PK
        text provider
        text external_id
        text name
        geography location
        boolean has_emergency "nullable"
        text_array specialties
        text verification_status "unverified|verified|stale"
        timestamptz last_synced_at
    }
```

## Deferred

- `app.documents`, `app.document_pages` — medical records and OCR
- `app.medicines`, `app.pharmacy_stock` — medicine catalogue and inventory
- `app.doctors`, `app.ambulances` — provider directories
- `app.knowledge_documents`, `app.knowledge_chunks` — consented RAG corpus
- `app.notification_deliveries` — delivery audit

Each arrives with its module's migration, consent rules and clinical review. See
`docs/requirements/scope.md`.
