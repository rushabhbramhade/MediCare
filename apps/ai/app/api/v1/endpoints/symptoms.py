from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_symptoms_service
from app.schemas import IcareAnswer, SymptomGuidanceRequest
from app.symptoms.service import SymptomsService

router = APIRouter()


@router.post("/symptoms", response_model=IcareAnswer, tags=["icare"])
async def symptoms(
    request: SymptomGuidanceRequest,
    service: Annotated[SymptomsService, Depends(get_symptoms_service)],
) -> IcareAnswer:
    return await service.guide(request)
