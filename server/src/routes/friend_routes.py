"""
Social & Friend Network Router for Prodo FastAPI Backend.

Provides endpoints to list linked friends (`/friends/list`) and send friend invitations (`/friends/add`).
"""

from typing import Optional

from compat import create_json_response, create_error_response
from database import query_one, query_all, execute_db
from routes.auth_routes import extract_bearer_token, parse_json_body

try:
    from fastapi import APIRouter, Request, Header
    router = APIRouter(prefix="/friends", tags=["Friends"])
except ImportError:
    router = None
    Request = None
    Header = None


async def handle_get_friends_list(request=None, authorization: Optional[str] = None):
    """
    Returns the list of accepted friends and their current XP scores for the authenticated user.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("Missing token.", 401)

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("Invalid token session.", 401)

    # Fetch all friends connected to current user ID
    sql = """
    SELECT u.username, u.xp AS points
    FROM friends f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ?
    """
    friends = query_all(sql, (user["id"],))

    return create_json_response({"success": True, "friends": friends})


async def handle_add_friend(request, authorization: Optional[str] = None):
    """
    Adds a target friend user handle to the authenticated user's friend directory.
    Creates reciprocal entries in the friends table.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("Unauthorized.", 401)

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("Invalid user.", 401)

    body = await parse_json_body(request)
    target_handle = str(body.get("friend_username") or "").strip().lower()

    if not target_handle:
        return create_error_response("Friend username is required.", 400)

    target_user = query_one("SELECT * FROM users WHERE lower(username) = ?", (target_handle,))
    if not target_user:
        return create_error_response(f"User '{target_handle}' not found.", 404)

    if target_user["id"] == user["id"]:
        return create_error_response("You cannot add yourself as a friend.", 400)

    # Insert reciprocal friendship entries
    try:
        execute_db("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)", (user["id"], target_user["id"]))
        execute_db("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)", (target_user["id"], user["id"]))
    except Exception as e:
        print("Friend add error:", e)

    return create_json_response({"success": True, "message": f"Successfully linked with {target_user['username']}!"})


if router is not None:
    @router.get("/list")
    async def get_friends_list_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_get_friends_list(request, authorization)

    @router.post("/add")
    async def add_friend_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_add_friend(request, authorization)
