from abc import ABC, abstractmethod


class AiProvider(ABC):
    """Replaceable completion provider. No provider SDK is imported directly."""

    name: str

    @abstractmethod
    async def complete(
        self, *, system_prompt: str, user_prompt: str, max_tokens: int
    ) -> str:
        """Return plain text. Must raise AiProviderUnavailable on failure."""
