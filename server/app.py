from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from utils.focus_score import calculate_focus_score

#  Serve HTML on / later
# environment = jinja2.Environment()
# template = environment.from_string("Hello, {{ name }}!")


app = FastAPI()
_rolling_scores_by_session: dict[str, list[float]] = {}

leaderboard_data = [
    {"username": "A", "points": 2450},
    {"username": "B", "points": 1980},
    {"username": "C", "points": 1200},
]

friends = [
    {"username": "ronak", "points": 1980},
    {"username": "ivan", "points": 1200},
]



@app.get("/")
async def root():
    return "alive"

# ---------- CV Model Functionality ----------
@app.post("/check-focus")
async def check_focus(
    frame: UploadFile = File(...),
    session_id: str = Form("default"),
    include_debug: bool = Form(False),
    prefer_mediapipe: bool = Form(True),
):
    if not frame.content_type or not frame.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="frame must be an image upload")

    frame_bytes = await frame.read()
    if not frame_bytes:
        raise HTTPException(status_code=400, detail="uploaded frame is empty")

    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    buffer = np.frombuffer(frame_bytes, dtype=np.uint8)
    decoded_frame = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if decoded_frame is None:
        raise HTTPException(status_code=400, detail="could not decode uploaded image frame")

    rolling_scores = _rolling_scores_by_session.setdefault(session_id, [])

    try:
        result = calculate_focus_score(
            decoded_frame,
            rolling_scores,
            include_debug=include_debug,
            prefer_mediapipe=prefer_mediapipe,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"session_id": session_id, **result}

# ---------- Request Models ----------

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------- Authentication Endpoints ----------

@app.post("/auth/register")
async def register(user: RegisterRequest):
    """
    creates acc , placeholder for now
    """

    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "username": user.username,
            "email": user.email
        }
    }


@app.post("/auth/login")
async def login(user: LoginRequest):
    """
    for login, doesnt check passwrd as of now
    """

    return {
        "success": True,
        "token": "demo-jwt-token",
        "user": {
            "email": user.email
        }
    }


# ---------- users endspoint ----------

@app.get("/users/me")
async def get_current_user():
    return {
        "username": "ritish",
        "email": "ritish@example.com",
        "total_lifetime_points": 2500,
        "current_balance": 600
    }


class SyncRequest(BaseModel):
    points_earned_since_last_sync: int
    current_multiplier: float

@app.post("/users/sync")
async def sync(data: SyncRequest):
    return {
        "success": True,
        "points_added": data.points_earned_since_last_sync,
        "multiplier": data.current_multiplier
    }

# ---------- leaderboar endspoint ----------


@app.get("/leaderboard/global")
async def get_global_leaderboard():
    sorted_leaderboard = sorted(
        leaderboard_data,
        key=lambda user: user["points"],
        reverse=True
    )

    return {
        "success": True,
        "leaderboard": sorted_leaderboard
    }

#leaderboard for friends
@app.get("/leaderboard/friends")
async def get_friends_leaderboard():
    return {
        "success": True,
        "leaderboard": sorted(
            friends,
            key=lambda user: user["points"],
            reverse=True
        )
    }

