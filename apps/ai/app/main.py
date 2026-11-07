"""FastAPI application factory.

Routes are included directly on the app with explicit prefixes and
dependencies. APIRouter.include_router() is avoided because it is
unreliable in this FastAPI version.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import health, report_analysis, symptoms
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.security import require_internal_token
from app.ocr.endpoints import router as ocr_router


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="Medicare AI",
        version="0.1.0",
        description=(
            "Internal iCare AI service. Not a medical device. Outputs are explanations, "
            "not diagnoses, and must be reviewed against the clinical safety rules."
        ),
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url=None,
    )

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["GET", "POST"],
            allow_headers=["content-type", "x-internal-token"],
        )

    register_exception_handlers(app)

    # Public health.
    app.include_router(health.router, prefix="/v1")

    # iCare — /v1/icare/*, requires internal token.
    app.include_router(
        symptoms.router,
        prefix="/v1/icare",
        dependencies=[Depends(require_internal_token)],
    )
    app.include_router(
        report_analysis.router,
        prefix="/v1/icare",
        dependencies=[Depends(require_internal_token)],
    )

    # OCR — /v1/ocr/*, requires internal token.
    app.include_router(
        ocr_router,
        prefix="/v1",
        dependencies=[Depends(require_internal_token)],
    )

    return app


app = create_app()
