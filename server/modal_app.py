"""Prodo CV Engine - Modal.com Serverless Deployment

Serves the heavy computer vision model inference endpoint (`/check-focus`)
using Modal.com GPU/CPU serverless runners.
"""

from __future__ import annotations

import os
from typing import Optional
import modal

# ── Modal Image Setup ──────────────────────────────────────────────────────────
# Pre-install all required computer vision and ML libraries in the Modal container image.

cv_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "fastapi",
        "opencv-python-headless",
        "mediapipe",
        "numpy",
        "pillow",
        "onnxruntime",
        "python-multipart"
    ])
)

app = modal.App("prodo-cv", image=cv_image)

# ── FastAPI ASGI App definition ───────────────────────────────────────────────
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

web_app = FastAPI(title="Prodo CV Inference API")

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict via X-Prodo-CV-Key header verification
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRODO_CV_SECRET = os.getenv("PRODO_CV_SECRET", "prodo_cv_secret_key_default_2026")

_rolling_scores_by_session = {}

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

    # 2. Decode image frame
    import cv2
    import numpy as np
    
    contents = await frame.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image frame format")

    # 3. Calculate focus score using local utils
    try:
        from utils.focus_score import calculate_focus_score
    except ImportError:
        # Import fallback if path differs
        import sys
        sys.path.append("/root/server")
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
    return result


@web_app.get("/health")
async def health():
    return {"status": "ok", "service": "prodo-cv-modal"}


@app.function(image=cv_image)
@modal.asgi_app()
def fastapi_app():
    return web_app


@app.local_entrypoint()
def main():
    print("Modal CV App definition verified successfully!")

