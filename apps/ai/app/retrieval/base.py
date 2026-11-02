from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class RetrievedChunk:
    content: str
    source: str


class Retriever(Protocol):
    async def retrieve(
        self, *, patient_ref: str, query: str, limit: int
    ) -> list[RetrievedChunk]: ...


class NullRetriever:
    """
    Used until consent-backed pgvector retrieval is implemented.
    Returning no chunks is deliberate: the service must never invent records.
    """

    async def retrieve(
        self, *, patient_ref: str, query: str, limit: int
    ) -> list[RetrievedChunk]:
        return []
