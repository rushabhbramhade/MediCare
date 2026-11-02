import json
import logging
from datetime import UTC, datetime

from app.clinical_safety.guard import (
    DISCLAIMERS,
    EMERGENCY_ANSWERS,
    SAFE_FALLBACKS,
    assess_safety,
    ensure_disclaimer,
    validate_answer,
)
from app.core.errors import AiProviderUnavailable
from app.intent.classifier import classify_intent
from app.language.language import language_name
from app.patient_context.redaction import redact_identifiers
from app.prompts import load_prompt
from app.providers.base import AiProvider
from app.retrieval.base import RetrievedChunk, Retriever
from app.schemas import (
    IcareAnswer,
    Intent,
    Language,
    PatientContext,
    ReportAnalysisRequest,
    SymptomGuidanceRequest,
)

logger = logging.getLogger(__name__)

REPORT_TASK = (
    "Explain what this report measures and what the values may mean in general terms. "
    "Only a clinician who knows the person can interpret it fully."
)


class IcarePipeline:
    """
    Order is deliberate:
    deterministic red-flag escalation -> provider availability -> optional
    consent-scoped retrieval -> completion -> output validation -> disclaimer.
    """

    def __init__(
        self,
        *,
        provider: AiProvider | None,
        retriever: Retriever,
        max_output_tokens: int = 800,
        retrieval_top_k: int = 6,
    ) -> None:
        self._provider = provider
        self._retriever = retriever
        self._max_output_tokens = max_output_tokens
        self._retrieval_top_k = retrieval_top_k

    async def respond_symptoms(self, request: SymptomGuidanceRequest) -> IcareAnswer:
        return await self._respond(
            question=request.question,
            mode="symptoms",
            language=request.language,
            patient_context=request.patient_context,
        )

    async def respond_report(self, request: ReportAnalysisRequest) -> IcareAnswer:
        return await self._respond(
            question=REPORT_TASK,
            mode="report_analysis",
            language=request.language,
            patient_context=request.patient_context,
            report_text=redact_identifiers(request.report_text),
        )

    async def _respond(
        self,
        *,
        question: str,
        mode: str,
        language: Language,
        patient_context: PatientContext,
        report_text: str | None = None,
    ) -> IcareAnswer:
        intent = classify_intent(question)
        safety = assess_safety(f"{question}\n{report_text or ''}")

        if safety.emergency:
            return IcareAnswer(
                answer=EMERGENCY_ANSWERS[language],
                urgency="emergency",
                red_flags=safety.matched,
                disclaimer=DISCLAIMERS[language],
                provider="safety-rules",
                intent=Intent.EMERGENCY,
                language=language,
                generated_at=datetime.now(UTC),
            )

        if self._provider is None:
            raise AiProviderUnavailable(
                "No AI provider is configured for this environment. "
                "Emergency guidance is still available."
            )

        chunks = await self._retrieve(question, patient_context)
        prompt = self._build_user_prompt(
            question=question,
            mode=mode,
            language=language,
            patient_context=patient_context,
            chunks=chunks,
            report_text=report_text,
        )

        raw = await self._provider.complete(
            system_prompt=load_prompt(mode),
            user_prompt=prompt,
            max_tokens=self._max_output_tokens,
        )

        validation = validate_answer(raw)
        if not validation.ok:
            logger.warning("ai_output_rejected violations=%s", ",".join(validation.violations))
            answer = SAFE_FALLBACKS[language]
        else:
            answer = ensure_disclaimer(validation.text, language)

        return IcareAnswer(
            answer=answer,
            urgency=safety.urgency,
            red_flags=safety.matched,
            sources=[chunk.source for chunk in chunks],
            disclaimer=DISCLAIMERS[language],
            provider=self._provider.name,
            intent=intent,
            language=language,
            generated_at=datetime.now(UTC),
        )

    async def _retrieve(
        self, question: str, patient_context: PatientContext
    ) -> list[RetrievedChunk]:
        if not patient_context.consent_granted or not patient_context.patient_ref:
            return []
        try:
            return await self._retriever.retrieve(
                patient_ref=patient_context.patient_ref,
                query=question,
                limit=self._retrieval_top_k,
            )
        except Exception:
            # Answering without records is safer than failing open with unrelated data.
            logger.warning("medical_record_retrieval_failed")
            return []

    @staticmethod
    def _build_user_prompt(
        *,
        question: str,
        mode: str,
        language: Language,
        patient_context: PatientContext,
        chunks: list[RetrievedChunk],
        report_text: str | None,
    ) -> str:
        sections = [f"Respond in {language_name(language)}."]

        if patient_context.consent_granted:
            context_data = patient_context.model_dump(
                include={"age_years", "sex", "conditions", "medications"},
                exclude_none=True,
            )
            meaningful = {
                key: value
                for key, value in context_data.items()
                if value not in ("unknown", [], "")
            }
            if meaningful:
                sections.append(
                    "Consent-approved patient context: "
                    + json.dumps(meaningful, ensure_ascii=False)
                )

        if chunks:
            excerpts = "\n".join(f"- [{chunk.source}] {chunk.content}" for chunk in chunks)
            sections.append("Consent-approved record excerpts:\n" + excerpts)
        elif mode == "report_analysis":
            sections.append("No prior records were provided. Use only the report text below.")

        if report_text:
            sections.append("Report text (identifiers redacted):\n" + report_text)

        prompt_lead = "Question from the person: " if mode == "symptoms" else "Task: "
        sections.append(prompt_lead + question)
        return "\n\n".join(sections)
