from app.orchestration.pipeline import IcarePipeline
from app.schemas import IcareAnswer, SymptomGuidanceRequest


class SymptomsService:
    def __init__(self, pipeline: IcarePipeline) -> None:
        self._pipeline = pipeline

    async def guide(self, request: SymptomGuidanceRequest) -> IcareAnswer:
        return await self._pipeline.respond_symptoms(request)
