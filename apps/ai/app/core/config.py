from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven configuration. No provider is hardcoded."""

    model_config = SettingsConfigDict(
        env_file=("../../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "test", "production"] = "development"
    log_level: str = "info"

    ai_provider: Literal["disabled", "openai-compatible"] = "disabled"
    ai_base_url: str | None = None
    ai_model: str | None = None
    ai_api_key: SecretStr | None = None
    ai_timeout_seconds: float = Field(default=45.0, gt=0, le=120)
    ai_max_output_tokens: int = Field(default=800, ge=100, le=4000)
    ai_retrieval_top_k: int = Field(default=6, ge=1, le=20)

    internal_service_token: SecretStr | None = None
    ai_allowed_origins: str = ""

    @field_validator(
        "ai_base_url",
        "ai_model",
        "ai_api_key",
        "internal_service_token",
        mode="before",
    )
    @classmethod
    def empty_string_is_unset(cls, value: object) -> object:
        """`.env.example` ships empty optional values; they must mean unset, not ''."""
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def require_provider_configuration(self) -> "Settings":
        if self.ai_provider == "disabled":
            return self
        missing = [
            name
            for name, value in (
                ("AI_BASE_URL", self.ai_base_url),
                ("AI_MODEL", self.ai_model),
                ("AI_API_KEY", self.ai_api_key),
            )
            if value is None or (isinstance(value, str) and not value.strip())
        ]
        if missing:
            raise ValueError(
                f"AI_PROVIDER={self.ai_provider} requires: {', '.join(missing)}"
            )
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ai_allowed_origins.split(",") if origin.strip()]

    @property
    def provider_configured(self) -> bool:
        return self.ai_provider != "disabled"


@lru_cache
def get_settings() -> Settings:
    return Settings()
