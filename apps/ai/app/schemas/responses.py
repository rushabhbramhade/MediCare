from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.requests import Intent, Language


class IcareAnswer(BaseModel):
    answer: str
    urgency: Literal["routine", "soon", "emergency"] = "routine"
    red_flags: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    disclaimer: str
    provider: str
    intent: Intent = Intent.GENERAL
    language: Language = Language.ENGLISH
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "medicare-ai"
    version: str = "0.1.0"
    provider_configured: bool
