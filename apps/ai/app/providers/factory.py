from app.core.config import Settings
from app.providers.base import AiProvider
from app.providers.openai_compatible import OpenAICompatibleProvider


def create_provider(settings: Settings) -> AiProvider | None:
    if settings.ai_provider == "disabled":
        return None

    if settings.ai_provider == "openai-compatible":
        if not settings.ai_base_url or not settings.ai_model or not settings.ai_api_key:
            raise ValueError("AI provider configuration is incomplete")
        return OpenAICompatibleProvider(
            base_url=settings.ai_base_url,
            api_key=settings.ai_api_key.get_secret_value(),
            model=settings.ai_model,
            timeout_seconds=settings.ai_timeout_seconds,
        )

    raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")
