"""
Co-Op Focus Session Router for Prodo FastAPI Backend.

Handles cooperative multiplayer focus rooms, allowlisting partners, active multipliers,
and room lifecycle management using raw Request JSON parsing.
"""

import time
import secrets
from typing import Optional
from fastapi import APIRouter, Request, Header
from fastapi.responses import JSONResponse

from ..database import query_one, query_all, execute_db
from .auth_routes import extract_bearer_token, parse_json_body

router = APIRouter(prefix="/coop", tags=["Co-Op Rooms"])


@router.post("/create")
async def create_coop_room(request: Request, authorization: Optional[str] = Header(None)):
    """
    Creates a new Co-Op Focus Session room and returns a unique 6-character room code.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Unauthorized."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "User session invalid."})

    session_id = secrets.token_hex(3).upper()

    execute_db(
        """
        INSERT INTO coop_sessions (session_id, host_user_id, is_active, started_at)
        VALUES (?, ?, 1, ?)
        """,
        (session_id, user["id"], time.time())
    )

    return {"success": True, "session_id": session_id, "message": "Co-Op session initialized successfully."}


@router.get("/active")
async def get_active_coop_rooms():
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
    return {"success": True, "rooms": rooms}


@router.post("/join")
async def join_coop_room(request: Request, authorization: Optional[str] = Header(None)):
    """
    Joins an existing active Co-Op focus session using the session ID.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Unauthorized."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "User session invalid."})

    body = await parse_json_body(request)
    session_id = str(body.get("session_id") or "").upper()

    if not session_id:
        return JSONResponse(status_code=400, content={"success": False, "error": "Session ID is required."})

    session = query_one("SELECT * FROM coop_sessions WHERE session_id = ? AND is_active = 1", (session_id,))
    if not session:
        return JSONResponse(status_code=404, content={"success": False, "error": "Co-Op room not found or inactive."})

    execute_db(
        "UPDATE coop_sessions SET friend_user_id = ? WHERE session_id = ?",
        (user["id"], session_id)
    )

    return {"success": True, "session_id": session_id, "message": "Joined Co-Op session!"}


@router.post("/end")
async def end_coop_room(request: Request, authorization: Optional[str] = Header(None)):
    """
    Terminates an active Co-Op focus session room.
    """
    body = await parse_json_body(request)
    session_id = str(body.get("session_id") or "").upper()
    if session_id:
        execute_db("UPDATE coop_sessions SET is_active = 0 WHERE session_id = ?", (session_id,))
    return {"success": True, "message": "Co-Op session terminated."}
