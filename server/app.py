from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from utils.focus_score import calculate_focus_score

#  Serve HTML on / later
# environment = jinja2.Environment()
# template = environment.from_string("Hello, {{ name }}!")


app = FastAPI()
_rolling_scores_by_session: dict[str, list[float]] = {}


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






#class Default(WorkerEntrypoint):
#    async def fetch(self, request):
#        import asgi
#        return await asgi.fetch(app, request.js_object, self.env)
