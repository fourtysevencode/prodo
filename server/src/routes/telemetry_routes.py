"""
Telemetry Logging Router for Prodo FastAPI Backend.

Stores high-frequency gaze telemetry event logs and system metrics using raw Request JSON parsing.
"""

import time
from typing import Optional
from fastapi import APIRouter, Request, Header

from ..database import execute_db, query_all
from .auth_routes import parse_json_body

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("/log")
async def log_telemetry(request: Request):
    """
    Logs telemetry event signals (infractions, gaze state transitions, session events).
    """
    body = await parse_json_body(request)
    event = str(body.get("event") or "UNKNOWN_EVENT")
    session_id = str(body.get("session_id") or "default")
    details = str(body.get("details") or "")

    execute_db(
        """
        INSERT INTO telemetry_logs (event, session_id, details, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (event, session_id, details, time.time())
    )
    return {"success": True, "message": "Telemetry event logged."}


@router.get("/dev-logs")
async def get_telemetry_logs():
    """
    Fetches recent telemetry log records for dev portal monitoring.
    """
    logs = query_all("SELECT * FROM telemetry_logs ORDER BY created_at DESC LIMIT 50")
    return {"success": True, "telemetry": logs}
