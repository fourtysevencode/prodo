"""
Co-Op Focus Session Router for Prodo FastAPI Backend.

Handles cooperative multiplayer focus rooms, allowlisting partners, active multipliers,
and room lifecycle management using raw Request JSON parsing.
"""

import time
import secrets
from typing import Optional

from ..compat import create_json_response, create_error_response
from ..database import query_one, query_all, execute_db
from .auth_routes import extract_bearer_token, parse_json_body

try:
    from fastapi import APIRouter, Request, Header
    router = APIRouter(prefix="/coop", tags=["Co-Op Rooms"])
except ImportError:
    router = None
    Request = None
    Header = None


async def handle_create_coop_room(request, authorization: Optional[str] = None):
    """
    Creates a new Co-Op Focus Session room and returns a unique 6-character room code.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("Unauthorized.", 401)

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("User session invalid.", 401)

    session_id = secrets.token_hex(3).upper()

    execute_db(
        """
        INSERT INTO coop_sessions (session_id, host_user_id, is_active, started_at)
        VALUES (?, ?, 1, ?)
        """,
        (session_id, user["id"], time.time())
    )

    return create_json_response({"success": True, "session_id": session_id, "message": "Co-Op session initialized successfully."})


async def handle_get_active_coop_rooms():
    """
    Returns list of active public/discoverable Co-Op focus rooms.
    """
    sql = """
    SELECT c.session_id, u.username AS host_username, c.started_at
    FROM coop_sessions c
    JOIN users u ON c.host_user_id = u.id
    WHERE c.is_active = 1
    ORDER BY c.started_at DESC
    LIMIT 20
    """
    rooms = query_all(sql)
    return create_json_response({"success": True, "rooms": rooms})


async def handle_join_coop_room(request, authorization: Optional[str] = None):
    """
    Joins an existing active Co-Op focus session using the session ID.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("Unauthorized.", 401)

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("User session invalid.", 401)

    body = await parse_json_body(request)
    session_id = str(body.get("session_id") or "").upper()

    if not session_id:
        return create_error_response("Session ID is required.", 400)

    session = query_one("SELECT * FROM coop_sessions WHERE session_id = ? AND is_active = 1", (session_id,))
    if not session:
        return create_error_response("Co-Op room not found or inactive.", 404)

    execute_db(
        "UPDATE coop_sessions SET friend_user_id = ? WHERE session_id = ?",
        (user["id"], session_id)
    )

    return create_json_response({"success": True, "session_id": session_id, "message": "Joined Co-Op session!"})


async def handle_end_coop_room(request, authorization: Optional[str] = None):
    """
    Terminates an active Co-Op focus session room.
    """
    body = await parse_json_body(request)
    session_id = str(body.get("session_id") or "").upper()
    if session_id:
        execute_db("UPDATE coop_sessions SET is_active = 0 WHERE session_id = ?", (session_id,))
    return create_json_response({"success": True, "message": "Co-Op session terminated."})


if router is not None:
    @router.post("/create")
    async def create_coop_room_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_create_coop_room(request, authorization)

    @router.get("/active")
    async def get_active_coop_rooms_route():
        return await handle_get_active_coop_rooms()

    @router.post("/join")
    async def join_coop_room_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_join_coop_room(request, authorization)

    @router.post("/end")
    async def end_coop_room_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_end_coop_room(request, authorization)
