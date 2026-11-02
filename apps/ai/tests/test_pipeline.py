import pytest

from app.core.errors import AiProviderUnavailable
from app.orchestration.pipeline import IcarePipeline
from app.patient_context.redaction import redact_identifiers
from app.providers.base import AiProvider
from app.report_analysis.service import ReportAnalysisService
from app.retrieval.base import NullRetriever, RetrievedChunk
from app.schemas import (
    Intent,
    PatientContext,
    ReportAnalysisRequest,
    SymptomGuidanceRequest,
)


class FakeProvider(AiProvider):
    name = "fake-provider"

    def __init__(self, answer: str | None = None) -> None:
        self.prompts: list[str] = []
        self._answer = answer or (
            "HbA1c reflects average blood sugar over about three months. "
            "Discuss values outside the printed reference range with your clinician."
        )

    async def complete(
        self, *, system_prompt: str, user_prompt: str, max_tokens: int
    ) -> str:
        self.prompts.append(user_prompt)
        return self._answer


class RecordingRetriever:
    def __init__(self) -> None:
        self.calls = 0

    async def retrieve(
        self, *, patient_ref: str, query: str, limit: int
    ) -> list[RetrievedChunk]:
        self.calls += 1
        return [RetrievedChunk(content="Authorized lab excerpt", source="record-1")]


async def test_emergency_escalates_before_provider_lookup() -> None:
    pipeline = IcarePipeline(provider=None, retriever=NullRetriever())
    answer = await pipeline.respond_symptoms(
        SymptomGuidanceRequest(question="I have severe bleeding and feel faint.")
    )
    assert answer.urgency == "emergency"
    assert answer.provider == "safety-rules"
    assert answer.intent is Intent.EMERGENCY
    assert "112" in answer.answer


async def test_missing_provider_returns_clear_error_for_non_emergency() -> None:
    pipeline = IcarePipeline(provider=None, retriever=NullRetriever())
    with pytest.raises(AiProviderUnavailable):
        await pipeline.respond_symptoms(
            SymptomGuidanceRequest(question="I have had a mild cough for three days.")
        )


async def test_report_identifiers_are_redacted_before_the_provider() -> None:
    provider = FakeProvider()
    pipeline = IcarePipeline(provider=provider, retriever=NullRetriever())
    service = ReportAnalysisService(pipeline)

    answer = await service.analyze(
        ReportAnalysisRequest(
            report_text=(
                "Patient email ravi@example.com, phone 9876543210, Aadhaar 1234 5678 9012. "
                "HbA1c 8.2 percent, reference range 4.0-5.6."
            )
        )
    )

    sent = provider.prompts[0]
    assert "ravi@example.com" not in sent
    assert "9876543210" not in sent
    assert "1234 5678 9012" not in sent
    assert "[email]" in sent
    assert "[phone]" in sent
    assert "[id]" in sent
    assert answer.provider == "fake-provider"
    assert "not a diagnosis" in answer.answer
    assert answer.intent is Intent.REPORT_EXPLANATION


async def test_retrieval_only_runs_with_consent() -> None:
    retriever = RecordingRetriever()
    provider = FakeProvider()
    pipeline = IcarePipeline(provider=provider, retriever=retriever)

    await pipeline.respond_report(
        ReportAnalysisRequest(
            report_text="HbA1c 8.2 percent, reference range 4.0-5.6.",
            patient_context=PatientContext(patient_ref="pseudo-1", consent_granted=False),
        )
    )
    assert retriever.calls == 0
    assert "Authorized lab excerpt" not in provider.prompts[-1]

    await pipeline.respond_report(
        ReportAnalysisRequest(
            report_text="HbA1c 8.2 percent, reference range 4.0-5.6.",
            patient_context=PatientContext(patient_ref="pseudo-1", consent_granted=True),
        )
    )
    assert retriever.calls == 1
    assert "Authorized lab excerpt" in provider.prompts[-1]


async def test_prohibited_output_is_replaced_with_a_safe_fallback() -> None:
    provider = FakeProvider(answer="You definitely have diabetes. Take 500 mg of metformin.")
    pipeline = IcarePipeline(provider=provider, retriever=NullRetriever())

    answer = await pipeline.respond_symptoms(
        SymptomGuidanceRequest(question="What do my blood sugar results mean?")
    )

    assert "definitely have" not in answer.answer
    assert "500 mg" not in answer.answer
    assert "qualified clinician" in answer.answer


def test_redaction_keeps_clinical_values() -> None:
    text = "Email a@b.com phone +91 98765 43210. HbA1c 8.2 percent."
    redacted = redact_identifiers(text)
    assert "a@b.com" not in redacted
    assert "98765 43210" not in redacted
    assert "HbA1c 8.2 percent" in redacted
