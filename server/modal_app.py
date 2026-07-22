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

currentDir = os.path.dirname(os.path.abspath(__file__))
utilsPath = os.path.join(currentDir, "utils")

cvImage = (
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
    .add_local_dir(utilsPath, remote_path="/root/utils")
)

app = modal.App("prodo-cv", image=cvImage)

# Ensure /root is on Python sys.path
if "/root" not in sys.path:
    sys.path.insert(0, "/root")

# ── FastAPI ASGI App definition ───────────────────────────────────────────────
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

webApp = FastAPI(title="Prodo CV Inference API", redirect_slashes=False)

webApp.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

prodoCvSecret = os.getenv("PRODO_CV_SECRET", "prodo_cv_secret_key_default_2026")

rollingScoresBySession = {}

@webApp.exception_handler(Exception)
async def globalExceptionHandler(request, exc):
    """Global exception handler converting uncaught inference exceptions into structured JSON responses."""
    import traceback
    errorStr = str(exc)
    traceStr = traceback.format_exc()
    print("CV Exception:", traceStr)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": errorStr, "detail": "Internal inference error"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )

@webApp.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handles CORS OPTIONS preflight requests across all endpoints."""
    return JSONResponse(
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "*",
        },
    )

@webApp.post("/check-focus")
async def checkFocus(
    frame: UploadFile = File(...),
    sessionId: str = Form("default"),
    includeDebug: str = Form("false"),
    xProdoCvKey: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None)
):
    """Computer Vision Focus Inference Endpoint.
    
    Verifies caller security via X-Prodo-CV-Key or Bearer token header,
    decodes the webcam frame, and returns focus scoring & landmark signals.
    """
    # 1. Security validation check
    providedKey = xProdoCvKey
    if not providedKey and authorization and authorization.startswith("Bearer "):
        providedKey = authorization.split("Bearer ", 1)[1].strip()
        
    expectedSecret = os.getenv("PRODO_CV_SECRET")
    if expectedSecret and providedKey != expectedSecret:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Prodo-CV-Key header")

    try:
        # 2. Decode raw image frame buffer with OpenCV
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
                    "session_id": sessionId
                },
                headers={"Access-Control-Allow-Origin": "*"}
            )

        # 3. Import and execute focus score calculator
        try:
            from utils.focus_score import calculate_focus_score
        except ImportError:
            if "/root" not in sys.path:
                sys.path.insert(0, "/root")
            from utils.focus_score import calculate_focus_score

        if sessionId not in rollingScoresBySession:
            rollingScoresBySession[sessionId] = []

        scoresList = rollingScoresBySession[sessionId]
        debugFlag = includeDebug.lower() == "true"

        result = calculate_focus_score(
            frame=image,
            rolling_scores=scoresList,
            frame_is_bgr=True,
            include_debug=debugFlag,
        )

        result["session_id"] = sessionId
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
                "session_id": sessionId,
                "error": "Internal frame processing exception"
            },
            headers={"Access-Control-Allow-Origin": "*"}
        )


@webApp.get("/health")
async def health():
    return {"status": "ok", "service": "prodo-cv-modal"}


@app.function(image=cvImage)
@modal.asgi_app()
def fastapi_app():
    return webApp
