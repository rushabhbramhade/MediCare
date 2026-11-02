# Domain map

Only foundation tables exist. Dashed boxes are deferred modules.

```mermaid
erDiagram
    USERS ||--o| PATIENT_PROFILES : "has"
    USERS ||--o{ CONSENTS : "grants"
    USERS ||--o{ AUDIT_LOGS : "acts (no FK)"

    USERS {
        uuid id PK "Supabase auth id"
        text phone
        text role "patient|doctor|pharmacist|admin"
        timestamptz created_at
        timestamptz updated_at
    }

    PATIENT_PROFILES {
        uuid user_id PK
        text display_name
        date date_of_birth
        text gender
        text preferred_language "en|hi"
        text emergency_contact_name
        text emergency_contact_phone
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
        text action
        text resource_type
        text resource_id
        text request_id
        inet ip
        jsonb metadata
        timestamptz created_at
    }
```

## Deferred

- `app.documents`, `app.document_pages` — medical records and OCR
- `app.medicines`, `app.pharmacy_stock` — medicine catalogue and inventory
- `app.hospitals`, `app.doctors`, `app.ambulances` — provider directories
- `app.knowledge_documents`, `app.knowledge_chunks` — consented RAG corpus
- `app.notification_deliveries` — delivery audit

Each arrives with its module's migration, consent rules and clinical review. See
`docs/requirements/scope.md`.
