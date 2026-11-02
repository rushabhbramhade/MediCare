from app.intent.classifier import classify_intent
from app.schemas import Intent


def test_routes_common_questions() -> None:
    assert classify_intent("I have chest pain right now") is Intent.EMERGENCY
    assert classify_intent("What does my HbA1c report mean?") is Intent.REPORT_EXPLANATION
    assert classify_intent("What is the dose of this medicine?") is Intent.MEDICINE_QUESTION
    assert classify_intent("I have a headache and fever") is Intent.SYMPTOM_GUIDANCE
    assert classify_intent("Hello there") is Intent.GENERAL
