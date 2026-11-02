from app.clinical_safety.guard import (
    DISCLAIMERS,
    assess_safety,
    ensure_disclaimer,
    validate_answer,
)
from app.schemas import Language


def test_emergency_red_flags_are_detected() -> None:
    assessment = assess_safety("I have chest pain and cannot breathe properly")
    assert assessment.emergency is True
    assert "chest pain" in assessment.matched
    assert assessment.urgency == "emergency"


def test_routine_text_is_not_escalated() -> None:
    assessment = assess_safety("I have a mild headache and a runny nose")
    assert assessment.emergency is False
    assert assessment.matched == []


def test_diagnosis_and_dosing_language_is_rejected() -> None:
    assert validate_answer("You definitely have diabetes.").ok is False
    assert validate_answer("Take 500 mg of metformin twice a day.").ok is False
    assert validate_answer("There is no need to see a doctor.").ok is False


def test_plain_explanation_passes_validation() -> None:
    result = validate_answer(
        "HbA1c reflects average blood sugar over about three months. "
        "A value above the reference range is worth discussing with your clinician."
    )
    assert result.ok is True
    assert result.violations == []


def test_disclaimer_is_added_once() -> None:
    disclaimer = DISCLAIMERS[Language.ENGLISH]
    once = ensure_disclaimer("Some explanation.", Language.ENGLISH)
    twice = ensure_disclaimer(once, Language.ENGLISH)
    assert disclaimer in once
    assert twice == once
