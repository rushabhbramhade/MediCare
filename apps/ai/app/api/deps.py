from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.core.config import get_settings
from app.orchestration.pipeline import IcarePipeline
from app.providers.factory import create_provider
from app.report_analysis.service import ReportAnalysisService
from app.retrieval.base import NullRetriever
from app.symptoms.service import SymptomsService


@lru_cache
def get_pipeline() -> IcarePipeline:
    settings = get_settings()
    return IcarePipeline(
        provider=create_provider(settings),
        retriever=NullRetriever(),
        max_output_tokens=settings.ai_max_output_tokens,
        retrieval_top_k=settings.ai_retrieval_top_k,
    )


def get_symptoms_service(
    pipeline: Annotated[IcarePipeline, Depends(get_pipeline)],
) -> SymptomsService:
    return SymptomsService(pipeline)


def get_report_service(
    pipeline: Annotated[IcarePipeline, Depends(get_pipeline)],
) -> ReportAnalysisService:
    return ReportAnalysisService(pipeline)
