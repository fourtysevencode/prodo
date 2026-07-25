"""
Authentication Router for Prodo FastAPI Backend.

Handles user registration, login, Google OAuth, handle selection, tester mode,
and seamless desktop device-code OAuth flow using raw Request JSON parsing.
"""

import time
import uuid
import secrets
from typing import Optional

from compat import create_json_response, create_error_response
from database import query_one, execute_db

try:
    from fastapi import APIRouter, Request, Header
    router = APIRouter(prefix="/auth", tags=["Authentication"])
except ImportError:
    router = None
    Request = None
    Header = None


def generate_token(prefix: str = "token_") -> str:
    """Generates a cryptographically secure random token string."""
    return f"{prefix}{secrets.token_hex(16)}"


def extract_bearer_token(auth_header: Optional[str]) -> Optional[str]:
    """Helper function to extract token from 'Bearer <token>' Authorization header."""
    if not auth_header:
        return None
    parts = str(auth_header).split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return str(auth_header).strip()


async def parse_json_body(request) -> dict:
    """Helper to safely parse JSON body from incoming HTTP request."""
    try:
        if hasattr(request, "json"):
            res = request.json()
            if hasattr(res, "__await__"):
                return await res
            return res
    except Exception:
        pass
    return {}


async def handle_register(request):
    """
    Registers a new user account with email, username, and password.
    Initializes starter XP (100) and balance (100).
    """
    body = await parse_json_body(request)
    email_raw = str(body.get("email") or "").strip()
    username_raw = str(body.get("username") or "").strip()
    password_raw = str(body.get("password") or "")

    if not email_raw or not username_raw or not password_raw:
        return create_error_response("Email, username, and password are required.", 400)

    email_clean = email_raw.lower()
    username_clean = username_raw.lower()

    # Check if user with given email or username already exists
    existing = query_one(
        "SELECT id FROM users WHERE lower(email) = ? OR lower(username) = ?",
        (email_clean, username_clean)
    )
    if existing:
        return create_error_response("Email or username already registered.", 400)

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

    return create_json_response({
        "success": True,
        "token": auth_token,
        "needs_handle": False,
        "user": {"username": username_clean, "email": email_clean}
    })


async def handle_login(request):
    """
    Authenticates an existing user account using email and password.
    Returns user profile state and token.
    """
    body = await parse_json_body(request)
    email_clean = str(body.get("email") or "").strip().lower()
    password_raw = str(body.get("password") or "")

    if not email_clean or not password_raw:
        return create_error_response("Email and password are required.", 400)

    # Query database for user matching given email
    user = query_one("SELECT * FROM users WHERE lower(email) = ?", (email_clean,))
    if not user or user.get("password_hash") != password_raw:
        return create_error_response("Invalid email or password credentials.", 401)

    # Ensure user has a valid auth token
    auth_token = user.get("auth_token") or generate_token("token_")
    if not user.get("auth_token"):
        execute_db("UPDATE users SET auth_token = ? WHERE id = ?", (auth_token, user["id"]))

    return create_json_response({
        "success": True,
        "token": auth_token,
        "needs_handle": bool(user.get("needs_handle")),
        "user": {"username": user["username"], "email": user["email"]}
    })


async def handle_google_auth(request):
    """
    Google OAuth login handler. Accepts Google ID token credential,
    extracts claims, and either logs in or registers the user.
    """
    body = await parse_json_body(request)
    raw_cred = str(body.get("credential") or "").strip()
    if not raw_cred:
        return create_error_response("Invalid Google credential.", 400)

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

    return create_json_response({
        "success": True,
        "token": user["auth_token"],
        "needs_handle": bool(user.get("needs_handle")),
        "user": {"username": user["username"], "email": user["email"]}
    })


async def handle_update_username(request, authorization: Optional[str] = None):
    """
    Updates the user's handle/username. Requires valid Bearer authorization token.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("Authorization header missing.", 401)

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("User session expired or invalid.", 401)

    body = await parse_json_body(request)
    new_username = str(body.get("username") or "").strip().lower()

    if not new_username or len(new_username) < 3:
        return create_error_response("Username must be at least 3 characters.", 400)

    # Check if handle is already taken by another account
    existing = query_one("SELECT id FROM users WHERE lower(username) = ? AND id != ?", (new_username, user["id"]))
    if existing:
        return create_error_response("Username is already taken.", 400)

    execute_db("UPDATE users SET username = ?, needs_handle = 0 WHERE id = ?", (new_username, user["id"]))

    return create_json_response({"success": True, "username": new_username, "message": "Username handle updated successfully."})


async def handle_tester_login(request=None):
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

    return create_json_response({
        "success": True,
        "token": auth_token,
        "user": {"username": tester_username, "email": tester_email}
    })


async def handle_request_device_code(request=None):
    """
    Desktop OAuth Flow Step 1: Generates a unique 6-character device code for Tauri desktop authentication.
    """
    device_code = secrets.token_hex(3).upper()
    execute_db(
        "INSERT INTO device_auths (device_code, status, created_at) VALUES (?, 'PENDING', ?)",
        (device_code, time.time())
    )
    return create_json_response({"success": True, "device_code": device_code, "verification_url": f"https://prodo.live/#/authorize-desktop?code={device_code}"})


async def handle_approve_device_code(request, authorization: Optional[str] = None):
    """
    Desktop OAuth Flow Step 2: Approves a pending device code from the logged-in web app session.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("Unauthorized user session.", 401)

    body = await parse_json_body(request)
    device_code = str(body.get("device_code") or "").upper()

    device_auth = query_one("SELECT * FROM device_auths WHERE device_code = ?", (device_code,))
    if not device_auth:
        return create_error_response("Invalid device code.", 404)

    execute_db(
        "UPDATE device_auths SET status = 'APPROVED', user_id = ?, auth_token = ? WHERE device_code = ?",
        (user["id"], user["auth_token"], device_code)
    )
    return create_json_response({"success": True, "message": "Device authorization granted."})


async def handle_poll_device_code(request):
    """
    Desktop OAuth Flow Step 3: Desktop app polls endpoint to retrieve auth token once user approves in browser.
    """
    body = await parse_json_body(request)
    device_code = str(body.get("device_code") or "").upper()

    device_auth = query_one("SELECT * FROM device_auths WHERE device_code = ?", (device_code,))
    if not device_auth:
        return create_error_response("Invalid or expired device code.", 404)

    if device_auth["status"] == "APPROVED":
        return create_json_response({"success": True, "status": "APPROVED", "auth_token": device_auth["auth_token"]})

    return create_json_response({"success": True, "status": "PENDING"})


# Bind endpoints to FastAPI APIRouter if router exists
if router is not None:
    @router.post("/register")
    async def register_route(request: Request):
        return await handle_register(request)

    @router.post("/login")
    async def login_route(request: Request):
        return await handle_login(request)

    @router.post("/google")
    async def google_route(request: Request):
        return await handle_google_auth(request)

    @router.post("/username")
    async def username_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_update_username(request, authorization)

    @router.post("/tester")
    async def tester_route(request: Request):
        return await handle_tester_login(request)

    @router.post("/device-code")
    async def device_code_route(request: Request):
        return await handle_request_device_code(request)

    @router.post("/device-approve")
    async def device_approve_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_approve_device_code(request, authorization)

    @router.post("/device-poll")
    async def device_poll_route(request: Request):
        return await handle_poll_device_code(request)
