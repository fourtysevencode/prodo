"""
Leaderboard Rankings Router for Prodo FastAPI Backend.

Provides endpoints for global focus leaderboards (`/leaderboard/global`)
and friends-only focus rankings (`/leaderboard/friends`).
"""

from typing import Optional
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from ..database import query_all, query_one
from .auth_routes import extract_bearer_token

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.api_route("/global", methods=["GET", "POST"])
async def get_global_leaderboard():
    """
    Returns the top 50 users ranked by total focus XP.
    """
    sql = """
    SELECT username, xp AS points, total_lifetime_points
    FROM users
    ORDER BY xp DESC
    LIMIT 50
    """
    entries = query_all(sql)
    return {"success": True, "leaderboard": entries}


@router.api_route("/friends", methods=["GET", "POST"])
async def get_friends_leaderboard(authorization: Optional[str] = Header(None)):
    """
    Returns leaderboard rankings restricted to the authenticated user and their linked friends.
    """
    token = extract_bearer_token(authorization)
    if not token:
        # Fallback to global if no token provided
        return await get_global_leaderboard()

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return await get_global_leaderboard()

    # Query friends + self rankings
    sql = """
    SELECT u.username, u.xp AS points
    FROM users u
    WHERE u.id = ? OR u.id IN (SELECT friend_id FROM friends WHERE user_id = ?)
    ORDER BY u.xp DESC
    """
    entries = query_all(sql, (user["id"], user["id"]))
    return {"success": True, "leaderboard": entries}
