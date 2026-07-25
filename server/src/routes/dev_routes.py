"""
Developer Portal Router for Prodo FastAPI Backend.

Handles dev authentication (`/dev/login`), dev stats (`/dev/stats`), and telemetry queries.
"""

from typing import Optional

from compat import create_json_response, create_error_response
from database import query_one, query_all, execute_db
from routes.auth_routes import extract_bearer_token, parse_json_body

try:
    from fastapi import APIRouter, Request, Header
    router = APIRouter(prefix="/dev", tags=["Developer Tools"])
except ImportError:
    router = None
    Request = None
    Header = None

DEV_SECRET = "prodo_dev_master_key_2026"


async def handle_dev_login(request, authorization: Optional[str] = None):
    """
    Authenticates account for developer portal access (dev.prodo.live).
    Sets the `is_dev = 1` flag on the user record.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    if not token:
        return create_error_response("User authentication required.", 401)

    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,))
    if not user:
        return create_error_response("Invalid session token.", 401)

    body = await parse_json_body(request)
    secret_key = str(body.get("secret_key") or "")

    if secret_key != DEV_SECRET:
        return create_error_response("Incorrect developer authorization key.", 403)

    execute_db("UPDATE users SET is_dev = 1 WHERE id = ?", (user["id"],))

    return create_json_response({"success": True, "message": "Developer privileges granted successfully!"})


async def handle_get_dev_stats(request=None, authorization: Optional[str] = None):
    """
    Returns platform health & telemetry metrics for dev.prodo.live portal.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,)) if token else None

    if not user or not user.get("is_dev"):
        return create_error_response("Access requires a developer account.", 403)

    user_count = query_one("SELECT COUNT(*) AS count FROM users")
    coop_count = query_one("SELECT COUNT(*) AS count FROM coop_sessions WHERE is_active = 1")
    telemetry_count = query_one("SELECT COUNT(*) AS count FROM telemetry_logs")

    return create_json_response({
        "success": True,
        "stats": {
            "total_users": user_count["count"] if user_count else 0,
            "active_coop_rooms": coop_count["count"] if coop_count else 0,
            "total_telemetry_events": telemetry_count["count"] if telemetry_count else 0,
            "system_status": "OPERATIONAL",
        }
    })


async def handle_get_dev_telemetry(request=None, authorization: Optional[str] = None):
    """
    Fetches raw telemetry log feed for dev portal inspection.
    """
    token = extract_bearer_token(authorization or (request.headers.get("authorization") if hasattr(request, "headers") else None))
    user = query_one("SELECT * FROM users WHERE auth_token = ?", (token,)) if token else None

    if not user or not user.get("is_dev"):
        return create_error_response("Access requires a developer account.", 403)

    logs = query_all("SELECT * FROM telemetry_logs ORDER BY created_at DESC LIMIT 100")
    return create_json_response({"success": True, "logs": logs})


if router is not None:
    @router.post("/login")
    async def dev_login_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_dev_login(request, authorization)

    @router.get("/stats")
    async def dev_stats_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_get_dev_stats(request, authorization)

    @router.get("/telemetry")
    async def dev_telemetry_route(request: Request, authorization: Optional[str] = Header(None)):
        return await handle_get_dev_telemetry(request, authorization)
