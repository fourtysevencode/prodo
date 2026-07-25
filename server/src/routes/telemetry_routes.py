"""
Telemetry Logging Router for Prodo FastAPI Backend.

Stores high-frequency gaze telemetry event logs and system metrics using raw Request JSON parsing.
"""

import time
from typing import Optional

from compat import create_json_response
from database import execute_db, query_all
from routes.auth_routes import parse_json_body

try:
    from fastapi import APIRouter, Request
    router = APIRouter(prefix="/telemetry", tags=["Telemetry"])
except ImportError:
    router = None
    Request = None


async def handle_log_telemetry(request):
    """
    Logs telemetry event signals (infractions, gaze state transitions, session events).
    """
    body = await parse_json_body(request)
    event = str(body.get("event") or "UNKNOWN_EVENT")
    session_id = str(body.get("session_id") or "default")
    details = str(body.get("details") or "")

    await execute_db(
        """
        INSERT INTO telemetry_logs (event, session_id, details, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (event, session_id, details, time.time())
    )
    return create_json_response({"success": True, "message": "Telemetry event logged."})


async def handle_get_telemetry_logs():
    """
    Fetches recent telemetry log records for dev portal monitoring.
    """
    logs = await query_all("SELECT * FROM telemetry_logs ORDER BY created_at DESC LIMIT 50")
    return create_json_response({"success": True, "telemetry": logs})


if router is not None:
    @router.post("/log")
    async def log_telemetry_route(request: Request):
        return await handle_log_telemetry(request)

    @router.get("/dev-logs")
    async def get_telemetry_logs_route():
        return await handle_get_telemetry_logs()
