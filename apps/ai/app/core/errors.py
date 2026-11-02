from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AiProviderUnavailable(Exception):
    """Raised when the configured AI provider cannot produce an answer."""


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AiProviderUnavailable)
    async def provider_unavailable_handler(
        _request: Request, exc: AiProviderUnavailable
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": str(exc)},
        )
