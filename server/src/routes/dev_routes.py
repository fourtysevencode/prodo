"""
Developer Portal Router for Prodo FastAPI Backend.

Handles dev authentication (`/dev/login`), dev stats (`/dev/stats`), and telemetry queries.
"""

from typing import Optional
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from ..models import DevLoginRequest
from ..database import query_one, query_all, execute_db
from .auth_routes import extract_bearer_token

router = APIRouter(prefix="/dev", tags=["Developer Tools"])

DEV_SECRET = "prodo_dev_master_key_2026"


@router.post("/login")
async def dev_login(body: DevLoginRequest, authorization: Optional[str] = Header(None)):
    """
    Authenticates account for developer portal access (dev.prodo.live).
    Sets the `is_dev = 1` flag on the user record.
    """
    token = extract_bearer_token(authorization)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "error": "User authentication required."})

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid session token."})

    if body.secret_key != DEV_SECRET:
        return JSONResponse(status_code=403, content={"success": False, "error": "Incorrect developer authorization key."})

    execute_db("UPDATE users SET is_dev = 1 WHERE id = ?", (user["id"],))

    return {"success": True, "message": "Developer privileges granted successfully!"}


@router.get("/stats")
async def get_dev_stats(authorization: Optional[str] = Header(None)):
    """
    Returns platform health & telemetry metrics for dev.prodo.live portal.
    """
    token = extract_bearer_token(authorization)
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,)) if token else None

    if not user or not user.get("is_dev"):
        return JSONResponse(status_code=403, content={"success": False, "error": "Access requires a developer account."})

    user_count = query_one("SELECT COUNT(*) AS count FROM users")
    coop_count = query_one("SELECT COUNT(*) AS count FROM coop_sessions WHERE is_active = 1")
    telemetry_count = query_one("SELECT COUNT(*) AS count FROM telemetry_logs")

    return {
        "success": True,
        "stats": {
            "total_users": user_count["count"] if user_count else 0,
            "active_coop_rooms": coop_count["count"] if coop_count else 0,
            "total_telemetry_events": telemetry_count["count"] if telemetry_count else 0,
            "system_status": "OPERATIONAL",
        }
    }


@router.get("/telemetry")
async def get_dev_telemetry(authorization: Optional[str] = Header(None)):
    """
    Fetches raw telemetry log feed for dev portal inspection.
    """
    token = extract_bearer_token(authorization)
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,)) if token else None

    if not user or not user.get("is_dev"):
        return JSONResponse(status_code=403, content={"success": False, "error": "Access requires a developer account."})

    logs = query_all("SELECT * FROM telemetry_logs ORDER BY created_at DESC LIMIT 100")
    return {"success": True, "logs": logs}
