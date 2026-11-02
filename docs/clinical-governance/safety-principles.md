# Safety principles

iCare is an explanation and navigation aid. It is **not** a medical device, a diagnosis,
a prescription or a substitute for a clinician.

## Non-negotiable rules

1. **Emergency first.** Deterministic red-flag rules run before any model call. If they
   match, the user gets a fixed escalation answer and emergency numbers (112 in India).
   The model is not consulted, so a provider outage cannot hide an emergency.
2. **No diagnosis.** Output must not state or imply a condition the person has.
   "This value is above the usual range; a clinician should interpret it" is acceptable.
   "You have diabetes" is not.
3. **No dosing or treatment plans.** No medicine doses, schedules, substitutions or
   interaction advice. Those need a licensed source and clinical sign-off.
4. **Uncertainty is stated.** Missing history, unreadable reports and unknown values are
   named, not filled in.
5. **Consent gates records.** Retrieval runs only when `consent_granted` is true and a
   pseudonymous `patient_ref` is present. Failure to retrieve means answering without
   records, never with someone else's.
6. **Identifiers are removed.** Names, phone numbers, ids and addresses are redacted
   before prompts. The service does not need them.
7. **Output is validated.** Diagnosis and dosing language is detected and the response
   is replaced with a safe fallback plus a disclaimer.
8. **Plain language.** Hindi and English are supported. Calm, short sentences; no
   alarmist or sales language.
9. **Sources are shown.** If curated sources are used, the response lists them. The
   current retriever returns nothing, so no source is claimed.
10. **Humans stay in charge.** The UI tells the patient to consult a clinician and gives
    an emergency path.

## What the code enforces

- `app/clinical_safety/guard.py` — red flags, fixed emergency answers, disclaimers,
  output validation.
- `app/orchestration/pipeline.py` — ordering, consent-gated retrieval, redaction,
  safe fallback.
- `app/patient_context/redaction.py` — identifier removal.
- `app/response_validation/` — post-generation checks.
- Tests under `apps/ai/tests/` cover escalation, consent behaviour and rejection.

## What is not enforced

- No licensed clinical corpus is loaded; retrieval returns nothing.
- No clinician has reviewed the prompts or outputs in this repository.
- No adverse-event reporting workflow exists.
- No post-market monitoring, bias evaluation or language-quality evaluation exists.

## Before any patient-facing launch

1. Clinical review and sign-off of red-flag rules, prompts and disclaimer wording.
2. A licensed, attributable knowledge source with review dates.
3. Safety evaluation in Hindi and English, including adversarial and emergency cases.
4. A route for users to report a harmful answer, with a response SLA.
5. Legal review of telemedicine, liability and data-protection obligations.

Until then, the UI must keep saying iCare is not connected and must not present model
output as medical guidance.
