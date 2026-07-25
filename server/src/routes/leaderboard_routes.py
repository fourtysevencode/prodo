"""
Leaderboard Rankings Router for Prodo FastAPI Backend.

Provides endpoints for global focus leaderboards (`/leaderboard/global`)
and friends-only focus rankings (`/leaderboard/friends`).
"""

from typing import Optional

from compat import create_json_response
from database import query_all, query_one
from routes.auth_routes import extract_bearer_token

try:
    from fastapi import APIRouter, Request, Header
    router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])
except ImportError:
    router = None
    Request = None
    Header = None


async def handle_get_global_leaderboard():
    """
    Returns the top 50 users ranked by total focus XP.
    """
    sql = """
    SELECT username, xp AS points, total_lifetime_points
    FROM users
    ORDER BY xp DESC
    LIMIT 50
    """
    entries = await query_all(sql)
    return create_json_response({"success": True, "leaderboard": entries})


async def handle_get_friends_leaderboard(request=None, authorization: Optional[str] = None):
    """
    Returns leaderboard rankings restricted to the authenticated user and their linked friends.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        # Fallback to global if no token provided
        return await handle_get_global_leaderboard()

    user = await query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return await handle_get_global_leaderboard()

    # Query friends + self rankings
    sql = """
    SELECT u.username, u.xp AS points
    FROM users u
    WHERE u.id = ? OR u.id IN (SELECT friend_id FROM friends WHERE user_id = ?)
    ORDER BY u.xp DESC
    """
    entries = await query_all(sql, (user["id"], user["id"]))
    return create_json_response({"success": True, "leaderboard": entries})


if router is not None:
    @router.api_route("/global", methods=["GET", "POST"])
    async def global_leaderboard_route():
        return await handle_get_global_leaderboard()

    @router.api_route("/friends", methods=["GET", "POST"])
    async def friends_leaderboard_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_get_friends_leaderboard(request, authorization)
