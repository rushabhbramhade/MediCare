from app.orchestration.pipeline import IcarePipeline
from app.patient_context.redaction import redact_identifiers
from app.schemas import IcareAnswer, ReportAnalysisRequest

__all__ = ["ReportAnalysisService", "redact_identifiers"]


class ReportAnalysisService:
    def __init__(self, pipeline: IcarePipeline) -> None:
        self._pipeline = pipeline

    async def analyze(self, request: ReportAnalysisRequest) -> IcareAnswer:
        safe_request = request.model_copy(
            update={"report_text": redact_identifiers(request.report_text)}
        )
        return await self._pipeline.respond_report(safe_request)
