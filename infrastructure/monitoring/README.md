# Monitoring

## What exists in this build

- Structured logs from the API (`pino`) and workers, including request id, status,
  duration and audit events.
- `GET /health/live` — process liveness, no dependencies.
- `GET /health/ready` — checks Postgres and Redis; returns 503 with per-dependency
  status when either is unavailable.
- AI service `GET /health` — reports provider configuration without calling it.
- Audit log entries are written to the API logger; persistence to
  `app.audit_logs` is not implemented.

## What does not exist

No Prometheus metrics, no OpenTelemetry tracing, no dashboards, no alerting, no log
shipping. `METRICS_ENABLED` is reserved and currently unused. Do not claim a metric
exists because an env var is present.

## Before production

1. Ship logs to a store with retention appropriate to health data.
2. Scrape the readiness endpoint and alert on sustained failure.
3. Add request latency and queue-depth metrics; a growing BullMQ queue is the first
   visible sign of a stuck worker.
4. Trace API -> AI calls with a correlation id. Never put patient content in span
   attributes.
5. Define retention: audit logs outlive accounts; request logs must not.
