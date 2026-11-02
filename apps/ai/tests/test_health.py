from fastapi.testclient import TestClient


def test_health_is_public(client: TestClient) -> None:
    response = client.get("/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "medicare-ai"
    assert isinstance(body["provider_configured"], bool)


def test_icare_routes_require_internal_auth(client: TestClient) -> None:
    response = client.post(
        "/v1/icare/symptoms",
        json={"question": "I have had a mild headache for two days."},
    )
    assert response.status_code in (401, 503)
