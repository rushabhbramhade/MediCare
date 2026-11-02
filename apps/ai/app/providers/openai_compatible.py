import logging

import httpx

from app.core.errors import AiProviderUnavailable
from app.providers.base import AiProvider

logger = logging.getLogger(__name__)


class OpenAICompatibleProvider(AiProvider):
    """
    Works with any hosted provider exposing the OpenAI chat-completions shape.
    The base URL, model and key come from configuration, never source code.
    """

    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        model: str,
        timeout_seconds: float = 45.0,
    ) -> None:
        self._endpoint = f"{base_url.rstrip('/')}/chat/completions"
        self._api_key = api_key
        self._model = model
        self._timeout = timeout_seconds
        self.name = f"openai-compatible:{model}"

    async def complete(
        self, *, system_prompt: str, user_prompt: str, max_tokens: int
    ) -> str:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.2,
        }
        headers = {
            "authorization": f"Bearer {self._api_key}",
            "content-type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(self._endpoint, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            logger.warning("ai_provider_transport_error")
            raise AiProviderUnavailable("The AI provider is unavailable.") from exc

        if response.status_code >= 400:
            # Never log the response body: it can echo prompt or account details.
            logger.warning("ai_provider_http_error status=%s", response.status_code)
            raise AiProviderUnavailable("The AI provider is unavailable.")

        try:
            content = response.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            logger.warning("ai_provider_unexpected_response")
            raise AiProviderUnavailable(
                "The AI provider returned an unexpected response."
            ) from exc

        if not isinstance(content, str) or not content.strip():
            raise AiProviderUnavailable("The AI provider returned an empty answer.")
        return content.strip()
