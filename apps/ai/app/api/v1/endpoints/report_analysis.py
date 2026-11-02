from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_report_service
from app.report_analysis.service import ReportAnalysisService
from app.schemas import IcareAnswer, ReportAnalysisRequest

router = APIRouter()


@router.post("/reports/analyze", response_model=IcareAnswer, tags=["icare"])
async def analyze_report(
    request: ReportAnalysisRequest,
    service: Annotated[ReportAnalysisService, Depends(get_report_service)],
) -> IcareAnswer:
    return await service.analyze(request)
