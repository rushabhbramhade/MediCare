from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Language(StrEnum):
    ENGLISH = "en"
    HINDI = "hi"


class Intent(StrEnum):
    EMERGENCY = "emergency"
    SYMPTOM_GUIDANCE = "symptom_guidance"
    REPORT_EXPLANATION = "report_explanation"
    MEDICINE_QUESTION = "medicine_question"
    GENERAL = "general"


class PatientContext(BaseModel):
    """Context supplied by the API gateway only after a consent check."""

    model_config = ConfigDict(extra="forbid")

    patient_ref: str | None = Field(
        default=None,
        max_length=64,
        description="Pseudonymous reference. Never a phone number or government ID.",
    )
    consent_granted: bool = False
    age_years: int | None = Field(default=None, ge=0, le=120)
    sex: Literal["female", "male", "other", "unknown"] = "unknown"
    conditions: list[str] = Field(default_factory=list, max_length=20)
    medications: list[str] = Field(default_factory=list, max_length=20)


class SymptomGuidanceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=10, max_length=1000)
    language: Language = Language.ENGLISH
    patient_context: PatientContext = Field(default_factory=PatientContext)


class ReportAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    report_text: str = Field(min_length=20, max_length=20000)
    language: Language = Language.ENGLISH
    patient_context: PatientContext = Field(default_factory=PatientContext)
