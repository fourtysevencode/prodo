"""
Security and Authorization Test Suite for Prodo FastAPI Backend.

Validates authentication barriers, permission checks, SQL injection safety,
unauthorized access attempts, and developer token protection.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure server/src path is on sys.path
server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(server_dir, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from main import app
from database import init_db, query_one

init_db()
client = TestClient(app)


def test_unauthorized_user_me_access():
    """Ensure accessing /users/me without valid Bearer authorization returns 401 Unauthorized."""
    response = client.get("/users/me")
    assert response.status_code == 401
    assert response.json()["success"] is False

    response_bad_token = client.get("/users/me", headers={"Authorization": "Bearer invalid_fake_token_12345"})
    assert response_bad_token.status_code == 401
    assert response_bad_token.json()["success"] is False


def test_developer_portal_security_barrier():
    """Ensure non-developer accounts and unauthenticated users receive 403 Forbidden on dev endpoints."""
    # Attempt unauthenticated access to dev stats
    stats_resp = client.get("/dev/stats")
    assert stats_resp.status_code == 403

    # Attempt unauthenticated access to dev telemetry logs
    telem_resp = client.get("/dev/telemetry")
    assert telem_resp.status_code == 403

    # Attempt dev login with invalid secret key
    reg = client.post("/auth/register", json={
        "username": f"sec_user_{os.urandom(4).hex()}",
        "email": f"sec_user_{os.urandom(4).hex()}@prodo.live",
        "password": "password123"
    }).json()
    token = reg["token"]

    bad_dev_login = client.post("/dev/login", json={"secret_key": "wrong_secret_key"}, headers={"Authorization": f"Bearer {token}"})
    assert bad_dev_login.status_code == 403


def test_sql_injection_resilience():
    """Verify that malicious SQL injection inputs in username and email fields are handled safely without syntax errors."""
    sql_injection_payload = "' OR '1'='1"
    response = client.post("/auth/login", json={
        "email": sql_injection_payload,
        "password": "password"
    })
    # Should safely return 401 Unauthorized without crashing database
    assert response.status_code == 401
    assert response.json()["success"] is False


def test_device_oauth_security():
    """Verify device authorization polling returns 404 for non-existent codes."""
    poll_resp = client.post("/auth/device-poll", json={"device_code": "NONEXISTENT_CODE_999"})
    assert poll_resp.status_code == 404
    assert poll_resp.json()["success"] is False
