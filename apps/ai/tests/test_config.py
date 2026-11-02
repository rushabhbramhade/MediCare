import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_node_env_sets_the_runtime_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ENVIRONMENT", raising=False)
    monkeypatch.setenv("NODE_ENV", "production")
    settings = Settings(_env_file=None)
    assert settings.environment == "production"


def test_empty_optional_values_are_unset() -> None:
    settings = Settings(internal_service_token="", ai_base_url="", ai_model="", ai_api_key="")
    assert settings.internal_service_token is None
    assert settings.ai_base_url is None
    assert settings.ai_model is None
    assert settings.ai_api_key is None


def test_enabled_provider_requires_non_empty_configuration() -> None:
    with pytest.raises(ValidationError, match="AI_BASE_URL"):
        Settings(
            ai_provider="openai-compatible",
            ai_base_url="",
            ai_model="",
            ai_api_key="",
        )
