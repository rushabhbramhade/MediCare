import re
from dataclasses import dataclass
from typing import Literal

from app.schemas import Language

EMERGENCY_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("chest pain", re.compile(r"\bchest (pain|tightness|pressure)\b")),
    (
        "difficulty breathing",
        re.compile(
            r"\b(can't|cannot|can not|difficulty|trouble) breath(e|ing)?\b"
            r"|\bshortness of breath\b"
        ),
    ),
    ("not breathing", re.compile(r"\b(not breathing|stopped breathing|no pulse)\b")),
    (
        "unconscious",
        re.compile(r"\b(unconscious|unresponsive|fainted and (not|won't) wak(e|ing))\b"),
    ),
    (
        "severe bleeding",
        re.compile(r"\b(severe|heavy|uncontrolled) bleeding\b|\bbleeding heavily\b"),
    ),
    ("stroke signs", re.compile(r"\b(face droop|slurred speech|sudden weakness|stroke)\b")),
    ("seizure", re.compile(r"\b(seizure|convulsion|fitting)\b")),
    ("suicidal thoughts", re.compile(r"\b(suicid|kill myself|end my life|self[- ]harm)\b")),
    ("overdose", re.compile(r"\b(overdose|poisoning|swallowed too many)\b")),
    (
        "severe allergic reaction",
        re.compile(r"\b(anaphylaxis|throat (is )?swelling|swollen throat)\b"),
    ),
    ("pregnancy emergency", re.compile(r"\b(pregnant.*(bleeding|severe pain)|baby not moving)\b")),
]

PROHIBITED_OUTPUT_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("diagnosis", re.compile(r"\byou (definitely |clearly )?(have|are diagnosed with)\b")),
    ("diagnosis", re.compile(r"\bthis (confirms|means you have|proves you have)\b")),
    ("dosing", re.compile(r"\btake \d+(\.\d+)?\s?mg\b")),
    ("dosing", re.compile(r"\byou should take\b|\bstop taking\b|\bdouble your dose\b")),
    (
        "unsafe reassurance",
        re.compile(r"\b(no need to (see|consult) a doctor|it is safe to (ignore|wait))\b"),
    ),
    ("certainty", re.compile(r"\b(guaranteed|100% (safe|certain)|definitely not serious)\b")),
]

DISCLAIMERS: dict[Language, str] = {
    Language.ENGLISH: (
        "This is general information, not a diagnosis or a substitute for a qualified "
        "clinician. In an emergency, call 112."
    ),
    Language.HINDI: (
        "यह सामान्य जानकारी है, कोई निदान या योग्य डॉक्टर की सलाह का विकल्प नहीं। "
        "इमरजेंसी में 112 पर कॉल करें।"
    ),
}

EMERGENCY_ANSWERS: dict[Language, str] = {
    Language.ENGLISH: (
        "What you described may be an emergency. Call 112 now and follow the dispatcher's "
        "instructions. Do not wait for an app or drive yourself if you are unwell. If someone "
        "is with you, stay with them and unlock the door for responders."
    ),
    Language.HINDI: (
        "आपने जो बताया है वह इमरजेंसी हो सकती है। अभी 112 पर कॉल करें और डिस्पैचर के "
        "निर्देशों का पालन करें। ऐप का इंतज़ार न करें।"
    ),
}

SAFE_FALLBACKS: dict[Language, str] = {
    Language.ENGLISH: (
        "I cannot safely answer that as written. Please discuss it with a qualified clinician. "
        "If your symptoms are severe or getting worse, seek urgent care or call 112."
    ),
    Language.HINDI: (
        "मैं इसका सुरक्षित उत्तर नहीं दे सकता। कृपया किसी योग्य डॉक्टर से बात करें। "
        "अगर लक्षण गंभीर हैं या बढ़ रहे हैं, तो तुरंत इलाज लें या 112 पर कॉल करें।"
    ),
}


@dataclass(frozen=True)
class SafetyAssessment:
    emergency: bool
    matched: list[str]
    urgency: Literal["routine", "soon", "emergency"]


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    violations: list[str]
    text: str


def assess_safety(text: str) -> SafetyAssessment:
    normalized = text.lower()
    matched = [label for label, pattern in EMERGENCY_PATTERNS if pattern.search(normalized)]
    return SafetyAssessment(
        emergency=bool(matched),
        matched=matched,
        urgency="emergency" if matched else "routine",
    )


def validate_answer(text: str) -> ValidationResult:
    stripped = text.strip()
    violations: list[str] = []
    if not stripped:
        violations.append("empty_response")
    lowered = stripped.lower()
    for label, pattern in PROHIBITED_OUTPUT_PATTERNS:
        if pattern.search(lowered):
            violations.append(label)
    return ValidationResult(ok=not violations, violations=violations, text=stripped)


def ensure_disclaimer(text: str, language: Language) -> str:
    disclaimer = DISCLAIMERS[language]
    if disclaimer in text:
        return text
    return f"{text}\n\n{disclaimer}"
