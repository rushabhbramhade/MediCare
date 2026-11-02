from fastapi import APIRouter, Depends

from app.api.v1.endpoints import health, report_analysis, symptoms
from app.core.security import require_internal_token

router = APIRouter(prefix="/v1")
router.include_router(health.router)

icare = APIRouter(prefix="/icare", dependencies=[Depends(require_internal_token)])
icare.include_router(symptoms.router)
icare.include_router(report_analysis.router)
router.include_router(icare)
