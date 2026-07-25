"""
User Profile and Synchronization Router for Prodo FastAPI Backend.

Provides endpoints to retrieve authenticated user profile metrics (`/users/me`)
and submit periodic telemetry / focus point sync payloads (`/users/sync`).
"""

from typing import Optional
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from ..models import SyncRequest
from ..database import query_one, execute_db
from .auth_routes import extract_bearer_token

router = APIRouter(prefix="/users", tags=["User Profile"])


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """
    Returns current user details, XP balance, multiplier, and developer status.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Missing authorization token."})

    # Retrieve user matching the token
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid or expired session token."})

    return {
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
    }


@router.post("/sync")
async def sync_user_data(body: SyncRequest, authorization: Optional[str] = Header(None)):
    """
    Periodic focus state sync endpoint. Receives newly earned XP points, gaze multiplier,
    and system status telemetry to update the user's persistent balance.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "Authorization token missing."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "Session token invalid."})

    # Calculate new XP and lifetime points totals
    xp_gained = max(0, body.xp_gained or 0)
    new_xp = (user.get("xp") or 0) + xp_gained
    new_total = (user.get("total_lifetime_points") or 0) + xp_gained
    new_balance = (user.get("current_balance") or 0) + xp_gained
    new_multiplier = body.current_multiplier or 1.0

    # Update database record
    execute_db(
        """
        UPDATE users
        SET xp = ?, total_lifetime_points = ?, current_balance = ?, current_multiplier = ?
        WHERE id = ?
        """,
        (new_xp, new_total, new_balance, new_multiplier, user["id"])
    )

    return {
        "success": True,
        "xp": new_xp,
        "total_lifetime_points": new_total,
        "current_balance": new_balance,
        "multiplier": new_multiplier
    }
