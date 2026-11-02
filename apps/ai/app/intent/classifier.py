import re

from app.schemas import Intent

REPORT_TERMS = re.compile(
    r"\b(report|result|hba1c|haemoglobin|hemoglobin|cholesterol|creatinine|"
    r"blood test|lab test|x-ray|scan|mri|ct scan|biopsy|ecg|thyroid)\b"
)
MEDICINE_TERMS = re.compile(
    r"\b(medicine|medication|tablet|drug|dose|dosage|side effect|interaction|pharmacy)\b"
)
SYMPTOM_TERMS = re.compile(
    r"\b(pain|fever|cough|cold|headache|dizzy|nausea|vomit|rash|swelling|"
    r"tired|fatigue|diarrhea|constipation|symptom)\b"
)
EMERGENCY_TERMS = re.compile(
    r"\b(chest pain|can't breathe|shortness of breath|unconscious|severe bleeding|"
    r"stroke|seizure|suicid|overdose)\b"
)


def classify_intent(text: str) -> Intent:
    """Deterministic routing hint; the clinical safety layer still runs first."""
    lowered = text.lower()
    if EMERGENCY_TERMS.search(lowered):
        return Intent.EMERGENCY
    if REPORT_TERMS.search(lowered):
        return Intent.REPORT_EXPLANATION
    if MEDICINE_TERMS.search(lowered):
        return Intent.MEDICINE_QUESTION
    if SYMPTOM_TERMS.search(lowered):
        return Intent.SYMPTOM_GUIDANCE
    return Intent.GENERAL
