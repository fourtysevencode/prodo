"""
Authentication Router for Prodo FastAPI Backend.

Handles user registration, login, Google OAuth, handle selection, tester mode,
and seamless desktop device-code OAuth flow.
"""

import time
import uuid
import secrets
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse

from ..models import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    UsernameUpdateRequest,
    TesterLoginRequest,
    DeviceCodeRequest,
    DeviceCodeApproveRequest,
    DeviceCodePollRequest,
)
from ..database import query_one, execute_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_token(prefix: str = "token_") -> str:
    """Generates a cryptographically secure random token string."""
    return f"{prefix}{secrets.token_hex(16)}"


def extract_bearer_token(auth_header: Optional[str]) -> Optional[str]:
    """Helper function to extract token from 'Bearer <token>' Authorization header."""
    if not auth_header:
        return None
    parts = auth_header.split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return auth_header.strip()


@router.post("/register")
async def register(body: RegisterRequest):
    """
    Registers a new user account with email, username, and password.
    Initializes starter XP (100) and balance (100).
    """
    email_clean = body.email.strip().lower()
    username_clean = body.username.strip().lower()

    # Check if user with given email or username already exists
    existing = query_one(
        "SELECT id FROM users WHERE lower(email) = ? OR lower(username) = ?",
        (email_clean, username_clean)
    )
    if existing:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Email or username already registered."}
        )

    # Generate persistent auth token for auto-login
    auth_token = generate_token("token_")

    # Insert new user record into database
    execute_db(
        """
        INSERT INTO users (username, email, password_hash, xp, current_balance, auth_token, needs_handle)
        VALUES (?, ?, ?, 100, 100, ?, 0)
        """,
        (username_clean, email_clean, body.password, auth_token)
    )

    return {
        "success": True,
        "token": auth_token,
        "needs_handle": False,
        "user": {"username": username_clean, "email": email_clean}
    }


@router.post("/login")
async def login(body: LoginRequest):
    """
    Authenticates an existing user account using email and password.
    Returns user profile state and token.
    """
    email_clean = body.email.strip().lower()

    # Query database for user matching given email
    user = query_one("SELECT * FROM users WHERE lower(email) = ?", (email_clean,))
    if not user or user.get("password_hash") != body.password:
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Invalid email or password credentials."}
        )

    # Ensure user has a valid auth token
    auth_token = user.get("auth_token") or generate_token("token_")
    if not user.get("auth_token"):
        execute_db("UPDATE users SET auth_token = ? WHERE id = ?", (auth_token, user["id"]))

    return {
        "success": True,
        "token": auth_token,
        "needs_handle": bool(user.get("needs_handle")),
        "user": {"username": user["username"], "email": user["email"]}
    }


@router.post("/google")
async def google_auth(body: GoogleAuthRequest):
    """
    Google OAuth login handler. Accepts Google ID token credential,
    extracts claims, and either logs in or registers the user.
    """
    # For demo/mock integration, parse mock or decode token payload
    raw_cred = body.credential.strip()
    if not raw_cred:
        return JSONResponse(status_code=400, content={"success": False, "error": "Invalid Google credential."})

    # Generate synthetic email for credential string
    synth_email = f"google_user_{raw_cred[:8].lower()}@prodo.live"
    user = query_one("SELECT * FROM users WHERE email = ?", (synth_email,))

    if not user:
        auth_token = generate_token("token_")
        synth_username = f"user_{secrets.token_hex(4)}"
        execute_db(
            "INSERT INTO users (username, email, xp, current_balance, auth_token, needs_handle) VALUES (?, ?, 100, 100, ?, 1)",
            (synth_username, synth_email, auth_token)
        )
        user = query_one("SELECT * FROM users WHERE email = ?", (synth_email,))

    return {
        "success": True,
        "token": user["auth_token"],
        "needs_handle": bool(user.get("needs_handle")),
        "user": {"username": user["username"], "email": user["email"]}
    }


@router.post("/username")
async def update_username(body: UsernameUpdateRequest, authorization: Optional[str] = Header(None)):
    """
    Updates the user's handle/username. Requires valid Bearer authorization token.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Authorization header missing."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "User session expired or invalid."})

    new_handle = body.username.strip().lower()

    # Check if handle is already taken by another account
    existing = query_one("SELECT id FROM users WHERE lower(username) = ? AND id != ?", (new_handle, user["id"]))
    if existing:
        return JSONResponse(status_code=400, content={"success": False, "error": "Username is already taken."})

    execute_db("UPDATE users SET username = ?, needs_handle = 0 WHERE id = ?", (new_handle, user["id"]))

    return {"success": True, "username": new_handle, "message": "Username handle updated successfully."}


@router.post("/tester")
async def tester_login(body: TesterLoginRequest):
    """
    Generates a temporary 24-hour guest/tester account.
    """
    tester_id = secrets.token_hex(4)
    tester_username = f"tester_{tester_id}"
    tester_email = f"tester_{tester_id}@prodo.live"
    auth_token = generate_token("tester_token_")

    execute_db(
        """
        INSERT INTO users (username, email, xp, current_balance, auth_token, is_tester, tester_expires_at, needs_handle)
        VALUES (?, ?, 500, 500, ?, 1, ?, 0)
        """,
        (tester_username, tester_email, auth_token, time.time() + 86400)
    )

    return {
        "success": True,
        "token": auth_token,
        "user": {"username": tester_username, "email": tester_email}
    }


@router.post("/device-code")
async def request_device_code(body: DeviceCodeRequest):
    """
    Desktop OAuth Flow Step 1: Generates a unique 6-character device code for Tauri desktop authentication.
    """
    device_code = secrets.token_hex(3).upper()
    execute_db(
        "INSERT INTO device_auths (device_code, status, created_at) VALUES (?, 'PENDING', ?)",
        (device_code, time.time())
    )
    return {"success": True, "device_code": device_code, "verification_url": f"https://prodo.live/#/authorize-desktop?code={device_code}"}


@router.post("/device-approve")
async def approve_device_code(body: DeviceCodeApproveRequest, authorization: Optional[str] = Header(None)):
    """
    Desktop OAuth Flow Step 2: Approves a pending device code from the logged-in web app session.
    """
    token = extract_bearer_token(authorization)
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "Unauthorized user session."})

    device_auth = query_one("SELECT * FROM device_auths WHERE device_code = ?", (body.device_code.upper(),))
    if not device_auth:
        return JSONResponse(status_code=404, content={"success": False, "error": "Invalid device code."})

    execute_db(
        "UPDATE device_auths SET status = 'APPROVED', user_id = ?, auth_token = ? WHERE device_code = ?",
        (user["id"], user["auth_token"], body.device_code.upper())
    )
    return {"success": True, "message": "Device authorization granted."}


@router.post("/device-poll")
async def poll_device_code(body: DeviceCodePollRequest):
    """
    Desktop OAuth Flow Step 3: Desktop app polls endpoint to retrieve auth token once user approves in browser.
    """
    device_auth = query_one("SELECT * FROM device_auths WHERE device_code = ?", (body.device_code.upper(),))
    if not device_auth:
        return JSONResponse(status_code=404, content={"success": False, "error": "Invalid or expired device code."})

    if device_auth["status"] == "APPROVED":
        return {"success": True, "status": "APPROVED", "auth_token": device_auth["auth_token"]}

    return {"success": True, "status": "PENDING"}
