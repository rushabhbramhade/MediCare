from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging


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
    app.include_router(v1_router)
    return app


app = create_app()
