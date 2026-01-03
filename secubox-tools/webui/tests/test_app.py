from fastapi.testclient import TestClient

from app.main import app


def test_modules_endpoint_lists_fixtures():
    client = TestClient(app)
    response = client.get("/api/modules")
    assert response.status_code == 200
    payload = response.json()
    assert "modules" in payload
    assert any(m["id"] == "secubox-core" for m in payload["modules"])


def test_api_run_preset_accepts_context():
    client = TestClient(app)
    response = client.post(
        "/api/presets/core-snapshot/run",
        json={"context": {"mode": "deep-dive"}},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["preset"]["id"] == "core-snapshot"
    assert payload["context"]["mode"] == "deep-dive"
