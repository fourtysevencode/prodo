"""
Pydantic data models for the Prodo FastAPI Backend.

Provides strict request and response body validation schemas for all endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field

# ── Authentication Models ───────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, description="Desired username handle")
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=4, description="Raw account password")


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Raw account password")


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID JWT token string")


class UsernameUpdateRequest(BaseModel):
    username: str = Field(..., min_length=3, description="New unique handle")


class TesterLoginRequest(BaseModel):
    passcode: Optional[str] = Field(None, description="Optional tester passcode")


class DeviceCodeRequest(BaseModel):
    client_name: Optional[str] = Field("desktop_app", description="Calling app client identifier")


class DeviceCodeApproveRequest(BaseModel):
    device_code: str = Field(..., description="Device authorization code")


class DeviceCodePollRequest(BaseModel):
    device_code: str = Field(..., description="Device code being polled for token")


# ── User & Sync Models ──────────────────────────────────────────────────────

class SyncRequest(BaseModel):
    xp_gained: Optional[int] = Field(0, description="XP earned during recent interval")
    current_multiplier: Optional[float] = Field(1.0, description="Active gaze focus multiplier")
    core_temp: Optional[float] = Field(36.5, description="System core temperature reading")


# ── Social & Friends Models ─────────────────────────────────────────────────

class AddFriendRequest(BaseModel):
    friend_username: str = Field(..., description="Target friend handle to add")


# ── Co-Op Session Models ────────────────────────────────────────────────────

class CreateCoopRequest(BaseModel):
    friend_username: Optional[str] = Field("", description="Optional target friend for session")


class JoinCoopRequest(BaseModel):
    session_id: str = Field(..., description="Unique 6-character room ID")


class EndCoopRequest(BaseModel):
    session_id: str = Field(..., description="Unique 6-character room ID to terminate")


# ── AI Whimsical Punishment Models ──────────────────────────────────────────

class VerifyAITaskRequest(BaseModel):
    task_id: str = Field(..., description="ID of the task being verified")
    user_answer: str = Field(..., description="User's submitted answer")


# ── Telemetry & Dev Models ──────────────────────────────────────────────────

class TelemetryLogRequest(BaseModel):
    event: str = Field(..., description="Event name identifier")
    session_id: Optional[str] = Field(None, description="Optional session tracking ID")
    details: Optional[str] = Field(None, description="Detailed JSON metadata payload")


class DevLoginRequest(BaseModel):
    secret_key: str = Field(..., description="Developer portal secret authorization key")
