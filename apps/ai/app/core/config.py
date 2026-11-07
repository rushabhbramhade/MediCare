from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven configuration. No provider is hardcoded."""

    model_config = SettingsConfigDict(
        env_file=("../../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        populate_by_name=True,
        extra="ignore",
    )

    # NODE_ENV is the shared runtime flag; ENVIRONMENT is an explicit override.
    environment: Literal["development", "test", "production"] = Field(
        default="development",
        validation_alias=AliasChoices("ENVIRONMENT", "NODE_ENV"),
    )
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

    # OCR / document extraction (Tesseract — local, no paid API key).
    # Independent of AI_PROVIDER: OCR works even when AI_PROVIDER=disabled.
    ocr_provider: Literal["disabled", "tesseract"] = "disabled"
    ocr_api_url: str | None = None
    ocr_api_key: SecretStr | None = None
    ocr_languages: str = "eng,hin,mar"
    ocr_max_file_size_mb: int = Field(default=20, ge=1, le=100)
    ocr_max_pages: int = Field(default=50, ge=1, le=200)
    ocr_timeout_seconds: int = Field(default=120, ge=10, le=600)

    @field_validator(
        "ai_base_url",
        "ai_model",
        "ai_api_key",
        "internal_service_token",
        "ocr_api_url",
        "ocr_api_key",
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

    @property
    def ocr_configured(self) -> bool:
        return self.ocr_provider == "tesseract"

    @property
    def ocr_language_list(self) -> list[str]:
        return [lang.strip() for lang in self.ocr_languages.split(",") if lang.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
