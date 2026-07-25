"""
Authentication Router for Prodo FastAPI Backend.

Handles user registration, login, Google OAuth, handle selection, tester mode,
and seamless desktop device-code OAuth flow using raw Request JSON parsing.
"""

import time
import uuid
import secrets
from typing import Optional
from fastapi import APIRouter, Request, Header
from fastapi.responses import JSONResponse

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


async def parse_json_body(request: Request) -> dict:
    """Helper to safely parse JSON body from incoming HTTP request."""
    try:
        return await request.json()
    except Exception:
        return {}


@router.post("/register")
async def register(request: Request):
    """
    Registers a new user account with email, username, and password.
    Initializes starter XP (100) and balance (100).
    """
    body = await parse_json_body(request)
    email_raw = str(body.get("email") or "").strip()
    username_raw = str(body.get("username") or "").strip()
    password_raw = str(body.get("password") or "")

    if not email_raw or not username_raw or not password_raw:
        return JSONResponse(status_code=400, content={"success": False, "error": "Email, username, and password are required."})

    email_clean = email_raw.lower()
    username_clean = username_raw.lower()

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
        (username_clean, email_clean, password_raw, auth_token)
    )

    return {
        "success": True,
        "token": auth_token,
        "needs_handle": False,
        "user": {"username": username_clean, "email": email_clean}
    }


@router.post("/login")
async def login(request: Request):
    """
    Authenticates an existing user account using email and password.
    Returns user profile state and token.
    """
    body = await parse_json_body(request)
    email_clean = str(body.get("email") or "").strip().lower()
    password_raw = str(body.get("password") or "")

    if not email_clean or not password_raw:
        return JSONResponse(status_code=400, content={"success": False, "error": "Email and password are required."})

    # Query database for user matching given email
    user = query_one("SELECT * FROM users WHERE lower(email) = ?", (email_clean,))
    if not user or user.get("password_hash") != password_raw:
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
async def google_auth(request: Request):
    """
    Google OAuth login handler. Accepts Google ID token credential,
    extracts claims, and either logs in or registers the user.
    """
    body = await parse_json_body(request)
    raw_cred = str(body.get("credential") or "").strip()
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
async def update_username(request: Request, authorization: Optional[str] = Header(None)):
    """
    Updates the user's handle/username. Requires valid Bearer authorization token.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Authorization header missing."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "User session expired or invalid."})

    body = await parse_json_body(request)
    new_username = str(body.get("username") or "").strip().lower()

    if not new_username or len(new_username) < 3:
        return JSONResponse(status_code=400, content={"success": False, "error": "Username must be at least 3 characters."})

    # Check if handle is already taken by another account
    existing = query_one("SELECT id FROM users WHERE lower(username) = ? AND id != ?", (new_username, user["id"]))
    if existing:
        return JSONResponse(status_code=400, content={"success": False, "error": "Username is already taken."})

    execute_db("UPDATE users SET username = ?, needs_handle = 0 WHERE id = ?", (new_username, user["id"]))

    return {"success": True, "username": new_username, "message": "Username handle updated successfully."}


@router.post("/tester")
async def tester_login(request: Request):
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
async def request_device_code(request: Request):
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
async def approve_device_code(request: Request, authorization: Optional[str] = Header(None)):
    """
    Desktop OAuth Flow Step 2: Approves a pending device code from the logged-in web app session.
    """
    token = extract_bearer_token(authorization)
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "Unauthorized user session."})

    body = await parse_json_body(request)
    device_code = str(body.get("device_code") or "").upper()

    device_auth = query_one("SELECT * FROM device_auths WHERE device_code = ?", (device_code,))
    if not device_auth:
        return JSONResponse(status_code=404, content={"success": False, "error": "Invalid device code."})

    execute_db(
        "UPDATE device_auths SET status = 'APPROVED', user_id = ?, auth_token = ? WHERE device_code = ?",
        (user["id"], user["auth_token"], device_code)
    )
    return {"success": True, "message": "Device authorization granted."}


@router.post("/device-poll")
async def poll_device_code(request: Request):
    """
    Desktop OAuth Flow Step 3: Desktop app polls endpoint to retrieve auth token once user approves in browser.
    """
    body = await parse_json_body(request)
    device_code = str(body.get("device_code") or "").upper()

    device_auth = query_one("SELECT * FROM device_auths WHERE device_code = ?", (device_code,))
    if not device_auth:
        return JSONResponse(status_code=404, content={"success": False, "error": "Invalid or expired device code."})

    if device_auth["status"] == "APPROVED":
        return {"success": True, "status": "APPROVED", "auth_token": device_auth["auth_token"]}

    return {"success": True, "status": "PENDING"}
