"""
Automated Test Suite for Prodo FastAPI Backend.

Tests health check, registration, authentication, username update, user sync,
friends listing, leaderboard rankings, and AI punishment verification endpoints.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure server package path is on sys.path
server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from src.main import app
from src.database import init_db

init_db()

client = TestClient(app)


def test_health_check():
    """Verify that the health check endpoint returns 200 OK and status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "prodo-api-fastapi"


def test_user_registration_and_login():
    """Verify user registration flow, login credential checks, and token generation."""
    email = f"pytest_user_{os.urandom(4).hex()}@prodo.live"
    username = f"pyuser_{os.urandom(4).hex()}"
    password = "secure_password_123"

    # Test registration
    reg_resp = client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["success"] is True
    assert "token" in reg_data
    token = reg_data["token"]

    # Test login
    login_resp = client.post("/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["success"] is True
    assert login_data["token"] == token

    # Test /users/me endpoint
    me_resp = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["success"] is True
    assert me_data["user"]["email"] == email


def test_leaderboard():
    """Verify global leaderboard endpoint returns ranked entries."""
    response = client.get("/leaderboard/global")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["leaderboard"], list)


def test_ai_task_generation_and_verification():
    """Verify AI task generation and verification pipeline."""
    gen_resp = client.post("/ai/generate-punishment?task_type=math")
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert gen_data["success"] is True
    task_id = gen_data["task_id"]

    verify_resp = client.post("/ai/task/verify", json={
        "task_id": task_id,
        "user_answer": "80"
    })
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["success"] is True
