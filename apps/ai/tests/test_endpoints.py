from fastapi.testclient import TestClient

from app.api.deps import get_symptoms_service
from app.core.security import require_internal_token
from app.main import app
from app.orchestration.pipeline import IcarePipeline
from app.retrieval.base import NullRetriever
from app.symptoms.service import SymptomsService


def test_emergency_guidance_works_without_an_ai_provider(client: TestClient) -> None:
    pipeline = IcarePipeline(provider=None, retriever=NullRetriever())
    app.dependency_overrides[get_symptoms_service] = lambda: SymptomsService(pipeline)
    app.dependency_overrides[require_internal_token] = lambda: None

    response = client.post(
        "/v1/icare/symptoms",
        json={"question": "My father is unconscious and not breathing."},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["urgency"] == "emergency"
    assert body["provider"] == "safety-rules"
    assert "112" in body["answer"]


def test_input_validation_rejects_short_questions(client: TestClient) -> None:
    app.dependency_overrides[require_internal_token] = lambda: None
    response = client.post("/v1/icare/symptoms", json={"question": "help"})
    assert response.status_code == 422
