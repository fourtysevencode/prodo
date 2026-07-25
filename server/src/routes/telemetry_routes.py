"""
Telemetry Logging Router for Prodo FastAPI Backend.

Stores high-frequency gaze telemetry event logs and system metrics.
"""

import time
from typing import Optional
from fastapi import APIRouter, Header

from ..models import TelemetryLogRequest
from ..database import execute_db, query_all

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("/log")
async def log_telemetry(body: TelemetryLogRequest):
    """
    Logs telemetry event signals (infractions, gaze state transitions, session events).
    """
    execute_db(
        """
        INSERT INTO telemetry_logs (event, session_id, details, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (body.event, body.session_id or "default", body.details or "", time.time())
    )
    return {"success": True, "message": "Telemetry event logged."}


@router.get("/dev-logs")
async def get_telemetry_logs():
    """
    Fetches recent telemetry log records for dev portal monitoring.
    """
    logs = query_all("SELECT * FROM telemetry_logs ORDER BY created_at DESC LIMIT 50")
    return {"success": True, "telemetry": logs}
