"""
User Profile and Synchronization Router for Prodo FastAPI Backend.

Provides endpoints to retrieve authenticated user profile metrics (`/users/me`)
and submit periodic telemetry / focus point sync payloads (`/users/sync`).
"""

from typing import Optional

from ..compat import create_json_response, create_error_response
from ..database import query_one, execute_db
from .auth_routes import extract_bearer_token, parse_json_body

try:
    from fastapi import APIRouter, Request, Header
    router = APIRouter(prefix="/users", tags=["User Profile"])
except ImportError:
    router = None
    Request = None
    Header = None


async def handle_get_me(request=None, authorization: Optional[str] = None):
    """
    Returns current user details, XP balance, multiplier, and developer status.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("Missing authorization token.", 401)

    # Retrieve user matching the token
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("Invalid or expired session token.", 401)

    return create_json_response({
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "xp": user.get("xp", 0),
            "current_multiplier": user.get("current_multiplier", 1.0),
            "total_lifetime_points": user.get("total_lifetime_points", 0),
            "current_balance": user.get("current_balance", 0),
            "is_dev": bool(user.get("is_dev")),
            "is_tester": bool(user.get("is_tester")),
            "needs_handle": bool(user.get("needs_handle")),
        }
    })


async def handle_sync_user_data(request, authorization: Optional[str] = None):
    """
    Periodic focus state sync endpoint. Receives newly earned XP points, gaze multiplier,
    and system status telemetry to update the user's persistent balance.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("Authorization token missing.", 401)

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("Session token invalid.", 401)

    body = await parse_json_body(request)

    # Calculate new XP and lifetime points totals
    xp_gained = max(0, int(body.get("xp_gained") or body.get("xp") or 0))
    new_xp = (user.get("xp") or 0) + xp_gained
    new_total = (user.get("total_lifetime_points") or 0) + xp_gained
    new_balance = (user.get("current_balance") or 0) + xp_gained
    new_multiplier = float(body.get("current_multiplier") or 1.0)

    # Update database record
    execute_db(
        """
        UPDATE users
        SET xp = ?, total_lifetime_points = ?, current_balance = ?, current_multiplier = ?
        WHERE id = ?
        """,
        (new_xp, new_total, new_balance, new_multiplier, user["id"])
    )

    return create_json_response({
        "success": True,
        "xp": new_xp,
        "total_lifetime_points": new_total,
        "current_balance": new_balance,
        "multiplier": new_multiplier
    })


if router is not None:
    @router.get("/me")
    async def get_me_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_get_me(request, authorization)

    @router.post("/sync")
    async def sync_user_data_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_sync_user_data(request, authorization)
