"""Top-level API router assembly.

All routes are defined on a single flat APIRouter to avoid issues with
APIRouter.include_router() in this FastAPI version.
"""

from fastapi import APIRouter, Depends

from app.api.v1.endpoints import health, report_analysis, symptoms
from app.ocr.endpoints import router as ocr_router
from app.core.security import require_internal_token

# Single flat router with /v1 prefix.
router = APIRouter(prefix="/v1")

# Health — public.
for route in health.router.routes:
    router.routes.append(route)

# iCare — requires internal token, /icare sub-path.
for route in symptoms.router.routes:
    route.path = "/icare" + route.path
    router.routes.append(route)
for route in report_analysis.router.routes:
    route.path = "/icare" + route.path
    router.routes.append(route)

# OCR — requires internal token, /ocr sub-path (already in route paths).
for route in ocr_router.routes:
    router.routes.append(route)

# Apply internal token dependency to iCare and OCR routes.
for route in router.routes:
    if route.path.startswith("/v1/icare") or route.path.startswith("/v1/ocr"):
        route.dependencies.append(Depends(require_internal_token))

__all__ = ["router"]
