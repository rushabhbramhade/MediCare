# 0003 — Providers disabled by default

**Status:** accepted

## Context

The product depends on hospitals, doctors, pharmacies, ambulances, SMS, OCR and an LLM.
None has a signed contract or production credential. The easiest way to make a demo look
complete is to fabricate data or silently fall back to a canned answer. In healthcare,
that is dangerous: a patient may act on it.

## Decision

- Every provider is `disabled` unless its full configuration is present.
- A disabled provider returns an explicit unavailable state or a fixed emergency
  response. It never returns invented hospitals, stock, availability or medical advice.
- Provider integrations sit behind adapter interfaces; business logic does not import a
  vendor SDK directly.
- The AI provider is `AI_PROVIDER=disabled` by default, and the service fails requests
  rather than generating an answer from a mock.

## Consequences

- The UI shows empty states and "not connected" notices. This is intended.
- Demos require real credentials or an explicitly labelled sandbox.
- Launch readiness is visible: a screen with no data is a missing integration, not a
  cosmetic bug.
