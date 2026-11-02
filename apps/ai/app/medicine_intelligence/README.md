# Medicine intelligence

**Status:** deferred.

Planned scope: normalize medicine and ingredient names, map them to a licensed Indian
dataset, and support pharmacy stock lookups by medicine id.

Explicitly out of scope for model output: dosing, interactions and substitution advice.
Those require a licensed clinical source and clinical governance sign-off.

The AI service must not answer medicine questions from model memory. `intent/classifier.py`
routes them today only so the gateway can respond with an honest "not available yet".
