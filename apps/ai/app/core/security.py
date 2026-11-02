import hmac
from typing import Annotated

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


async def require_internal_token(
    x_internal_token: Annotated[str | None, Header(alias="X-Internal-Token")] = None,
) -> None:
    """Service-to-service auth. The public internet must never call these routes."""
    expected = get_settings().internal_service_token
    if expected is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal service authentication is not configured.",
        )
    if not x_internal_token or not hmac.compare_digest(
        x_internal_token, expected.get_secret_value()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service token.",
        )
