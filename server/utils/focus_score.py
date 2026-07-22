"""Focus scoring from periodic webcam frames.

The main entry point is ``calculate_focus_score``. It expects one webcam frame
at a time, extracts face/head/eye/gaze signals, and returns a normalized focus
payload that can be sent to the raid sync loop.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from importlib import import_module
from math import atan2, degrees, sqrt
from statistics import fmean
from typing import Any, Dict, MutableSequence, Optional, Sequence


@dataclass(frozen=True)
class FocusScoreConfig:
    """Tunable thresholds for webcam focus scoring."""

    rolling_window: int = 5
    focused_threshold: float = 0.35
    distracted_threshold: float = 0.20
    current_focus_status_weight: float = 0.80
    rolling_focus_status_weight: float = 0.20

    face_presence_weight: float = 0.50
    head_pose_weight: float = 0.30
    gaze_weight: float = 0.10
    eyes_open_weight: float = 0.10

    yaw_ok_degrees: float = 40.0
    yaw_max_degrees: float = 75.0
    pitch_ok_degrees: float = 35.0
    pitch_max_degrees: float = 65.0
    pitch_down_ok_degrees: float = 45.0
    pitch_down_max_degrees: float = 80.0
    roll_ok_degrees: float = 35.0
    roll_max_degrees: float = 65.0

    eye_closed_ear: float = 0.10
    eye_open_ear: float = 0.18

    gaze_center_tolerance_x: float = 0.35
    gaze_max_offset_x: float = 0.60
    gaze_center_tolerance_y: float = 0.40
    gaze_max_offset_y: float = 0.65


LEFT_EYE_EAR = (33, 160, 158, 133, 153, 144)
RIGHT_EYE_EAR = (362, 385, 387, 263, 373, 380)
LEFT_EYE_BOX = (33, 133, 159, 145)
RIGHT_EYE_BOX = (362, 263, 386, 374)
LEFT_IRIS = (468, 469, 470, 471, 472)
RIGHT_IRIS = (473, 474, 475, 476, 477)

HEAD_POSE_LANDMARKS = (1, 152, 33, 263, 61, 291)
HEAD_POSE_MODEL_POINTS = (
    (0.0, 0.0, 0.0),       # nose tip
    (0.0, -63.6, -12.5),   # chin
    (-43.3, 32.7, -26.0),  # left eye outer corner
    (43.3, 32.7, -26.0),   # right eye outer corner
    (-28.9, -28.9, -24.1), # left mouth corner
    (28.9, -28.9, -24.1),  # right mouth corner
)


def calculate_focus_score(
    frame: Any,
    rolling_scores: Optional[MutableSequence[float]] = None,
    *,
    frame_is_bgr: bool = True,
    config: Optional[FocusScoreConfig] = None,
    include_debug: bool = False,
    prefer_mediapipe: bool = True,
) -> Dict[str, Any]:
    """Calculate focus status and signal scores from one webcam frame.

    Args:
        frame: A webcam image frame as a NumPy array. OpenCV frames are BGR by default.
        rolling_scores: Optional mutable list kept by the caller across frames.
        frame_is_bgr: Whether frame uses OpenCV's BGR channel order.
        config: Optional scoring thresholds.

    Returns:
        A dictionary containing status, focus_score, rolling_focus_score, and signals.
    """
    cfg = config or FocusScoreConfig()
    cv2, faceMeshModule, np = _load_vision_modules(prefer_mediapipe=prefer_mediapipe)

    if frame is None:
        return _build_payload(
            0.0, 0.0, 0.0, 0.0, rolling_scores, cfg
        )

    image = np.asarray(frame)
    if image.ndim != 3 or image.shape[2] < 3:
        raise ValueError("frame must be a color image shaped like (height, width, channels)")

    # Check for cell phone detection
    phoneDetected = False
    try:
        phoneDetected = _run_phone_detection(image)
    except Exception as exc:
        print(f"Phone detection failed: {exc}")

    if phoneDetected:
        return _build_payload(
            0.0, 0.0, 0.0, 0.0, rolling_scores, cfg,
            debug={"backend": "onnx-yolo", "phone_detected": True} if include_debug else None,
            phone_detected=True
        )

    if faceMeshModule is None:
        return _calculate_focus_score_with_opencv(
            image, rolling_scores, frame_is_bgr=frame_is_bgr, cv2=cv2, config=cfg, include_debug=include_debug
        )

    height, width = image.shape[:2]
    rgbFrame = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if frame_is_bgr else image
    rgbFrame.flags.writeable = False

    try:
        faceMesh = faceMeshModule.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.30,
        )
        result = faceMesh.process(rgbFrame)
        faceMesh.close()
    except Exception as exc:
        print(f"MediaPipe FaceMesh error, falling back to OpenCV: {exc}")
        return _calculate_focus_score_with_opencv(
            image, rolling_scores, frame_is_bgr=frame_is_bgr, cv2=cv2, config=cfg, include_debug=include_debug
        )

    if not result or not getattr(result, "multi_face_landmarks", None):
        return _build_payload(
            0.0, 0.0, 0.0, 0.0, rolling_scores, cfg,
            debug={"backend": "mediapipe", "face_count": 0} if include_debug else None,
        )

    landmarks = result.multi_face_landmarks[0].landmark
    points = _landmarks_to_points(landmarks, width, height, np)

    facePresence = _score_face_presence(points, width, height)
    headPose = _score_head_pose(points, width, height, cv2, np, cfg)
    eyesOpen = _score_eyes_open(points, cfg)
    gazeScore = _score_gaze(points, headPose, cfg, np)

    return _build_payload(
        facePresence, headPose, gazeScore, eyesOpen, rolling_scores, cfg,
        debug={"backend": "mediapipe", "face_count": 1} if include_debug else None,
    )


def _load_vision_modules(*, prefer_mediapipe: bool) -> tuple[Any, Any, Any]:
    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise ImportError(
            "calculate_focus_score requires opencv-python and numpy."
        ) from exc

    faceMeshModule = None
    if not prefer_mediapipe:
        return cv2, faceMeshModule, np

    try:
        import mediapipe as mp
        try:
            faceMeshModule = mp.solutions.face_mesh
        except AttributeError:
            for moduleName in ("mediapipe.solutions.face_mesh", "mediapipe.python.solutions.face_mesh"):
                try:
                    faceMeshModule = import_module(moduleName)
                    break
                except ImportError:
                    continue
    except ImportError:
        faceMeshModule = None

    return cv2, faceMeshModule, np


def _calculate_focus_score_with_opencv(
    image: Any,
    rolling_scores: Optional[MutableSequence[float]],
    *,
    frame_is_bgr: bool,
    cv2: Any,
    config: FocusScoreConfig,
    include_debug: bool,
) -> Dict[str, Any]:
    grayCode = cv2.COLOR_BGR2GRAY if frame_is_bgr else cv2.COLOR_RGB2GRAY
    gray = cv2.cvtColor(image, grayCode)
    gray = cv2.equalizeHist(gray)
    height, width = gray.shape[:2]

    cascadeDir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cascades")
    faceFilenames = (
        "haarcascade_frontalface_default.xml",
        "haarcascade_frontalface_alt2.xml",
        "haarcascade_profileface.xml",
    )

    faceCascades = []
    for filename in faceFilenames:
        localPath = os.path.join(cascadeDir, filename)
        if os.path.exists(localPath):
            cc = cv2.CascadeClassifier(localPath)
            if not cc.empty():
                faceCascades.append(cc)
                continue
        if getattr(cv2, "data", None) and getattr(cv2.data, "haarcascades", None):
            sysPath = os.path.join(cv2.data.haarcascades, filename)
            if os.path.exists(sysPath):
                cc = cv2.CascadeClassifier(sysPath)
                if not cc.empty():
                    faceCascades.append(cc)

    eyeCascadePath = os.path.join(cascadeDir, "haarcascade_eye.xml")
    if not os.path.exists(eyeCascadePath) and getattr(cv2, "data", None) and getattr(cv2.data, "haarcascades", None):
        eyeCascadePath = os.path.join(cv2.data.haarcascades, "haarcascade_eye.xml")

    eyeCascade = cv2.CascadeClassifier(eyeCascadePath) if os.path.exists(eyeCascadePath) else cv2.CascadeClassifier()

    minFaceSize = max(40, int(min(width, height) * 0.08))
    faces = []
    for faceCascade in faceCascades:
        if faceCascade.empty():
            continue

        detected = faceCascade.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(minFaceSize, minFaceSize),
        )
        faces.extend(tuple(face) for face in detected)

    if len(faces) == 0:
        return _build_payload(
            0.0, 0.0, 0.0, 0.0, rolling_scores, config,
            debug={"backend": "opencv_haar", "face_count": 0} if include_debug else None,
        )

    x, y, faceWidth, faceHeight = max(faces, key=lambda f: f[2] * f[3])
    faceAreaRatio = (faceWidth * faceHeight) / float(width * height)
    facePresence = _scale_between(faceAreaRatio, low=0.003, high=0.030)

    faceCenterX = x + faceWidth / 2.0
    faceCenterY = y + faceHeight / 2.0
    horizontalOffset = abs((faceCenterX / width) - 0.5)
    verticalDelta = (faceCenterY / height) - 0.48
    horizontalScore = _offset_score(horizontalOffset, ok_offset=0.14, max_offset=0.34)
    if verticalDelta > 0:
        verticalScore = _offset_score(verticalDelta, ok_offset=0.24, max_offset=0.45)
    else:
        verticalScore = _offset_score(abs(verticalDelta), ok_offset=0.16, max_offset=0.36)
    headPose = 0.70 * horizontalScore + 0.30 * verticalScore

    faceGray = gray[y : y + faceHeight, x : x + faceWidth]
    eyes = ()
    if not eyeCascade.empty():
        eyes = eyeCascade.detectMultiScale(
            faceGray,
            scaleFactor=1.1,
            minNeighbors=3,
            minSize=(14, 14),
        )
    eyesOpen = _clamp(len(eyes) / 2.0)

    gazeScore = (0.80 * headPose) if len(eyes) == 0 else (0.65 * headPose + 0.35 * eyesOpen)

    return _build_payload(
        facePresence, headPose, gazeScore, eyesOpen, rolling_scores, config,
        debug={"backend": "opencv_haar", "face_count": len(faces)} if include_debug else None,
    )


def _build_payload(
    face_presence: float,
    head_pose: float,
    gaze: float,
    eyes_open: float,
    rolling_scores: Optional[MutableSequence[float]],
    config: FocusScoreConfig,
    debug: Optional[Dict[str, Any]] = None,
    phone_detected: bool = False,
) -> Dict[str, Any]:
    if phone_detected:
        signals = {
            "face_presence": 0.0,
            "head_pose": 0.0,
            "gaze": 0.0,
            "eyes_open": 0.0,
        }
        payload = {
            "status": "DISTRACTED",
            "focus_score": 0.0,
            "rolling_focus_score": 0.0,
            "signals": signals,
            "phone": True,
        }
        if debug is not None:
            debug["phone_detected"] = True
            payload["debug"] = debug
        return payload

    signals = {
        "face_presence": round(_clamp(face_presence), 4),
        "head_pose": round(_clamp(head_pose), 4),
        "gaze": round(_clamp(gaze), 4),
        "eyes_open": round(_clamp(eyes_open), 4),
    }

    totalWeight = (
        config.face_presence_weight
        + config.head_pose_weight
        + config.gaze_weight
        + config.eyes_open_weight
    )
    focusScore = (
        config.face_presence_weight * signals["face_presence"]
        + config.head_pose_weight * signals["head_pose"]
        + config.gaze_weight * signals["gaze"]
        + config.eyes_open_weight * signals["eyes_open"]
    ) / totalWeight
    focusScore = round(_clamp(focusScore), 4)

    if rolling_scores is not None:
        rolling_scores.append(focusScore)
        del rolling_scores[:-config.rolling_window]
        rollingFocusScore = round(_clamp(fmean(rolling_scores)), 4)
    else:
        rollingFocusScore = focusScore

    statusTotalWeight = config.current_focus_status_weight + config.rolling_focus_status_weight
    if statusTotalWeight <= 0:
        statusFocusScore = focusScore
    else:
        statusFocusScore = round(
            _clamp(
                (
                    config.current_focus_status_weight * focusScore
                    + config.rolling_focus_status_weight * rollingFocusScore
                )
                / statusTotalWeight
            ),
            4,
        )

    currentFrameHasNoFocusSignal = (
        focusScore <= 0.05
        or (
            signals["face_presence"] <= 0.05
            and signals["head_pose"] <= 0.05
            and signals["gaze"] <= 0.05
            and signals["eyes_open"] <= 0.05
        )
    )

    if currentFrameHasNoFocusSignal:
        status = "DISTRACTED"
    elif statusFocusScore >= config.focused_threshold:
        status = "FOCUSED"
    elif statusFocusScore < config.distracted_threshold:
        status = "DISTRACTED"
    else:
        status = "UNCERTAIN"

    payload = {
        "status": status,
        "focus_score": focusScore,
        "rolling_focus_score": rollingFocusScore,
        "signals": signals,
        "phone": False,
    }
    if debug is not None:
        payload["debug"] = debug

    return payload


def _landmarks_to_points(landmarks: Sequence[Any], width: int, height: int, np: Any) -> Any:
    return np.array([(lm.x * width, lm.y * height, lm.z) for lm in landmarks], dtype=np.float64)


def _score_face_presence(points: Any, width: int, height: int) -> float:
    xMin, yMin = points[:, 0].min(), points[:, 1].min()
    xMax, yMax = points[:, 0].max(), points[:, 1].max()
    faceAreaRatio = ((xMax - xMin) * (yMax - yMin)) / float(width * height)

    # Seated webcam framing saturates presence score
    return _scale_between(faceAreaRatio, low=0.003, high=0.030)


def _score_head_pose(
    points: Any,
    width: int,
    height: int,
    cv2: Any,
    np: Any,
    config: FocusScoreConfig,
) -> float:
    """Calculates 3D head pose orientation using solvePnP and Euler angle conversion."""
    imagePoints = np.array([points[index, :2] for index in HEAD_POSE_LANDMARKS], dtype=np.float64)
    modelPoints = np.array(HEAD_POSE_MODEL_POINTS, dtype=np.float64)
    focalLength = float(width)
    cameraMatrix = np.array(
        ((focalLength, 0.0, width / 2.0), (0.0, focalLength, height / 2.0), (0.0, 0.0, 1.0)),
        dtype=np.float64,
    )
    distortion = np.zeros((4, 1), dtype=np.float64)

    success, rotationVector, _ = cv2.solvePnP(
        modelPoints, imagePoints, cameraMatrix, distortion, flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not success:
        return 0.0

    rotationMatrix, _ = cv2.Rodrigues(rotationVector)
    pitch, yaw, roll = _rotation_matrix_to_euler(rotationMatrix)

    yawScore = _angle_score(yaw, config.yaw_ok_degrees, config.yaw_max_degrees)
    pitchScore = _pitch_score(pitch, config)
    rollScore = _angle_score(roll, config.roll_ok_degrees, config.roll_max_degrees)

    return 0.55 * yawScore + 0.35 * pitchScore + 0.10 * rollScore


def _rotation_matrix_to_euler(rotation_matrix: Any) -> tuple[float, float, float]:
    """Converts a 3x3 OpenCV rotation matrix to Euler angles (pitch, yaw, roll) in degrees."""
    sy = sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
    singular = sy < 1e-6

    if not singular:
        pitch = atan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
        yaw = atan2(-rotation_matrix[2, 0], sy)
        roll = atan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
    else:
        pitch = atan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
        yaw = atan2(-rotation_matrix[2, 0], sy)
        roll = 0.0

    return degrees(pitch), degrees(yaw), degrees(roll)


def _score_eyes_open(points: Any, config: FocusScoreConfig) -> float:
    leftEar = _eye_aspect_ratio(points, LEFT_EYE_EAR)
    rightEar = _eye_aspect_ratio(points, RIGHT_EYE_EAR)
    averageEar = (leftEar + rightEar) / 2.0

    return _scale_between(averageEar, low=config.eye_closed_ear, high=config.eye_open_ear)


def _eye_aspect_ratio(points: Any, indices: Sequence[int]) -> float:
    p1, p2, p3, p4, p5, p6 = (points[index, :2] for index in indices)
    vertical = _distance(p2, p6) + _distance(p3, p5)
    horizontal = 2.0 * _distance(p1, p4)

    if horizontal == 0:
        return 0.0

    return float(vertical / horizontal)


def _score_gaze(points: Any, head_pose_score: float, config: FocusScoreConfig, np: Any) -> float:
    if len(points) <= max(RIGHT_IRIS):
        return head_pose_score

    leftScore = _single_eye_gaze_score(points, LEFT_EYE_BOX, LEFT_IRIS, config, np)
    rightScore = _single_eye_gaze_score(points, RIGHT_EYE_BOX, RIGHT_IRIS, config, np)

    if leftScore is None or rightScore is None:
        return head_pose_score

    irisScore = (leftScore + rightScore) / 2.0
    return 0.75 * irisScore + 0.25 * head_pose_score


def _single_eye_gaze_score(
    points: Any,
    eye_indices: Sequence[int],
    iris_indices: Sequence[int],
    config: FocusScoreConfig,
    np: Any,
) -> Optional[float]:
    eyePoints = np.array([points[index, :2] for index in eye_indices], dtype=np.float64)
    irisCenter = np.array([points[index, :2] for index in iris_indices], dtype=np.float64).mean(axis=0)

    xMin, yMin = eyePoints.min(axis=0)
    xMax, yMax = eyePoints.max(axis=0)
    eyeWidth = xMax - xMin
    eyeHeight = yMax - yMin

    if eyeWidth <= 0 or eyeHeight <= 0:
        return None

    xRatio = (irisCenter[0] - xMin) / eyeWidth
    yRatio = (irisCenter[1] - yMin) / eyeHeight

    xOffset = abs(float(xRatio) - 0.5)
    yOffset = abs(float(yRatio) - 0.5)

    xScore = _offset_score(xOffset, config.gaze_center_tolerance_x, config.gaze_max_offset_x)
    yScore = _offset_score(yOffset, config.gaze_center_tolerance_y, config.gaze_max_offset_y)

    return 0.75 * xScore + 0.25 * yScore


def _angle_score(angle_degrees: float, ok_degrees: float, max_degrees: float) -> float:
    return _offset_score(abs(angle_degrees), ok_degrees, max_degrees)


def _pitch_score(pitch_degrees: float, config: FocusScoreConfig) -> float:
    if pitch_degrees >= 0:
        return _offset_score(pitch_degrees, config.pitch_down_ok_degrees, config.pitch_down_max_degrees)
    return _offset_score(abs(pitch_degrees), config.pitch_ok_degrees, config.pitch_max_degrees)


def _offset_score(offset: float, ok_offset: float, max_offset: float) -> float:
    if offset <= ok_offset:
        return 1.0
    if offset >= max_offset:
        return 0.0
    return 1.0 - ((offset - ok_offset) / (max_offset - ok_offset))


def _scale_between(value: float, low: float, high: float) -> float:
    if value <= low:
        return 0.0
    if value >= high:
        return 1.0
    return (value - low) / (high - low)


def _distance(point_a: Any, point_b: Any) -> float:
    return float(sqrt(((point_a - point_b) ** 2).sum()))


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, float(value)))


_ONNX_SESSION = None

def _run_phone_detection(image: Any) -> bool:
    """Runs YOLOv8 ONNX object detection model to detect cell phone distraction."""
    global _ONNX_SESSION
    if _ONNX_SESSION is None:
        import onnxruntime
        import os
        modelPaths = [
            "model/model.onnx",
            "../model/model.onnx",
            "/code/model/model.onnx",
            "/root/prodo/model/model.onnx"
        ]
        modelPath = None
        for p in modelPaths:
            if os.path.exists(p):
                modelPath = p
                break
        
        if not modelPath:
            return False
            
        _ONNX_SESSION = onnxruntime.InferenceSession(
            modelPath, 
            providers=["CPUExecutionProvider"]
        )

    import cv2
    import numpy as np

    # YOLOv8 input is 640x640 RGB
    imgResized = cv2.resize(image, (640, 640))
    imgRgb = cv2.cvtColor(imgResized, cv2.COLOR_BGR2RGB)
    imgData = imgRgb.astype(np.float32) / 255.0
    imgData = imgData.transpose(2, 0, 1)
    imgData = np.expand_dims(imgData, axis=0)
    
    outputs = _ONNX_SESSION.run(None, {"images": imgData})[0]
    phoneConfs = outputs[0, 71, :]
    maxPhoneConf = float(phoneConfs.max())

    if maxPhoneConf > 0.40:
        return True

    return False
