"""Prodo CV Engine - Modal.com Serverless Deployment

Serves the heavy computer vision model inference endpoint (`/check-focus`)
using Modal.com GPU/CPU serverless runners.
"""

from __future__ import annotations

import os
import sys
from typing import Optional
import modal

# ── Modal Image Setup ──────────────────────────────────────────────────────────
# Pre-install all required computer vision and ML libraries in the Modal container image.

current_dir = os.path.dirname(os.path.abspath(__file__))
utils_path = os.path.join(current_dir, "utils")

cv_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(["libgl1", "libglib2.0-0", "libsm6", "libxext6", "libxrender-dev"])
    .pip_install([
        "fastapi",
        "opencv-python-headless",
        "mediapipe",
        "numpy",
        "pillow",
        "onnxruntime",
        "python-multipart"
    ])
    .add_local_dir(utils_path, remote_path="/root/utils")
)

app = modal.App("prodo-cv", image=cv_image)

# Ensure /root is on Python sys.path
if "/root" not in sys.path:
    sys.path.insert(0, "/root")

# ── FastAPI ASGI App definition ───────────────────────────────────────────────
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

web_app = FastAPI(title="Prodo CV Inference API", redirect_slashes=False)

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRODO_CV_SECRET = os.getenv("PRODO_CV_SECRET", "prodo_cv_secret_key_default_2026")

_rolling_scores_by_session = {}

@web_app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    error_str = str(exc)
    trace_str = traceback.format_exc()
    print("CV Exception:", trace_str)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": error_str, "detail": "Internal inference error"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )

@web_app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return JSONResponse(
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "*",
        },
    )

@web_app.post("/check-focus")
async def check_focus(
    frame: UploadFile = File(...),
    session_id: str = Form("default"),
    include_debug: str = Form("false"),
    x_prodo_cv_key: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None)
):
    """Computer Vision Focus Inference Endpoint.
    
    Verifies caller security via X-Prodo-CV-Key or Bearer token header,
    decodes the webcam frame, and returns focus scoring & landmark signals.
    """
    # 1. Security check
    provided_key = x_prodo_cv_key
    if not provided_key and authorization and authorization.startswith("Bearer "):
        provided_key = authorization.split("Bearer ", 1)[1].strip()
        
    expected_secret = os.getenv("PRODO_CV_SECRET")
    if expected_secret and provided_key != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Prodo-CV-Key header")

    try:
        # 2. Decode image frame
        import cv2
        import numpy as np
        
        contents = await frame.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return JSONResponse(
                content={
                    "status": "UNCERTAIN",
                    "focus_score": 0.5,
                    "rolling_focus_score": 0.5,
                    "signals": {"face_presence": 0.0, "head_pose": 0.0, "gaze": 0.0, "eyes_open": 0.0},
                    "phone": False,
                    "session_id": session_id
                },
                headers={"Access-Control-Allow-Origin": "*"}
            )

        # 3. Calculate focus score using local utils
        try:
            from utils.focus_score import calculate_focus_score
        except ImportError:
            if "/root" not in sys.path:
                sys.path.insert(0, "/root")
            from utils.focus_score import calculate_focus_score

        if session_id not in _rolling_scores_by_session:
            _rolling_scores_by_session[session_id] = []

        scores_list = _rolling_scores_by_session[session_id]
        debug_flag = include_debug.lower() == "true"

        result = calculate_focus_score(
            frame=image,
            rolling_scores=scores_list,
            frame_is_bgr=True,
            include_debug=debug_flag,
        )

        result["session_id"] = session_id
        return JSONResponse(content=result, headers={"Access-Control-Allow-Origin": "*"})
    except Exception as err:
        print("CV Frame Processing Exception Handled:", err)
        return JSONResponse(
            content={
                "status": "UNCERTAIN",
                "focus_score": 0.5,
                "rolling_focus_score": 0.5,
                "signals": {"face_presence": 0.5, "head_pose": 0.5, "gaze": 0.5, "eyes_open": 0.5},
                "phone": False,
                "session_id": session_id,
                "error": str(err)
            },
            headers={"Access-Control-Allow-Origin": "*"}
        )


@web_app.get("/health")
async def health():
    return {"status": "ok", "service": "prodo-cv-modal"}


@app.function(image=cv_image)
@modal.asgi_app()
def fastapi_app():
    return web_app
