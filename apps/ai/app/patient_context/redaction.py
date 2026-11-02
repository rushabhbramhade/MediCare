import re

EMAIL_PATTERN = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
AADHAAR_PATTERN = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
INDIAN_MOBILE_PATTERN = re.compile(r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)")


def redact_identifiers(text: str) -> str:
    """Removes common identifiers before text reaches a hosted model.

    This is a safety net, not a de-identification guarantee. Structured PHI must
    never be placed in a prompt in the first place.
    """
    redacted = EMAIL_PATTERN.sub("[email]", text)
    redacted = AADHAAR_PATTERN.sub("[id]", redacted)
    redacted = INDIAN_MOBILE_PATTERN.sub("[phone]", redacted)
    return redacted
