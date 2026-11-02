# iCare gateway

**Status:** Deferred — foundation only

## Responsibility

Gateway between the web app and the independently deployable AI service. Enforces consent, quotas and conversation ownership; contains no clinical logic.

## Data owned

- `app.icare_conversations`
- `app.icare_messages` (minimised content, retention-limited)

## Planned HTTP surface

- `POST /v1/icare/ask`
- `GET /v1/icare/conversations`
- `DELETE /v1/icare/conversations/:id`

## Security and safety notes

Calls the AI service over the private network with `INTERNAL_SERVICE_TOKEN`. Passes only consented context. Never returns a diagnosis; emergency red flags must route to the emergency path. AI output is checked by the service response validator before display.

## Next step

Implement after the AI service contract stabilises and consent storage exists.

See [docs/architecture](../../../../docs/architecture/system-overview.md) and the API conventions in [docs/api](../../../../docs/api/api-conventions.md).
