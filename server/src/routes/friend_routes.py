"""
Social & Friend Network Router for Prodo FastAPI Backend.

Provides endpoints to list linked friends (`/friends/list`) and send friend invitations (`/friends/add`).
"""

from typing import Optional
from fastapi import APIRouter, Request, Header
from fastapi.responses import JSONResponse

from ..database import query_one, query_all, execute_db
from .auth_routes import extract_bearer_token, parse_json_body

router = APIRouter(prefix="/friends", tags=["Friends"])


@router.get("/list")
async def get_friends_list(authorization: Optional[str] = Header(None)):
    """
    Returns the list of accepted friends and their current XP scores for the authenticated user.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Missing token."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token session."})

    # Fetch all friends connected to current user ID
    sql = """
    SELECT u.username, u.xp AS points
    FROM friends f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ?
    """
    friends = query_all(sql, (user["id"],))

    return {"success": True, "friends": friends}


@router.post("/add")
async def add_friend(request: Request, authorization: Optional[str] = Header(None)):
    """
    Adds a target friend user handle to the authenticated user's friend directory.
    Creates reciprocal entries in the friends table.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Unauthorized."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid user."})

    body = await parse_json_body(request)
    target_handle = str(body.get("friend_username") or "").strip().lower()

    if not target_handle:
        return JSONResponse(status_code=400, content={"success": False, "error": "Friend username is required."})

    target_user = query_one("SELECT * FROM users WHERE lower(username) = ?", (target_handle,))
    if not target_user:
        return JSONResponse(status_code=404, content={"success": False, "error": f"User '{target_handle}' not found."})

    if target_user["id"] == user["id"]:
        return JSONResponse(status_code=400, content={"success": False, "error": "You cannot add yourself as a friend."})

    # Insert reciprocal friendship entries
    try:
        execute_db("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)", (user["id"], target_user["id"]))
        execute_db("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)", (target_user["id"], user["id"]))
    except Exception as e:
        print("Friend add error:", e)

    return {"success": True, "message": f"Successfully linked with {target_user['username']}!"}
