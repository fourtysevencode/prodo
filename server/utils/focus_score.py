"""Focus scoring from periodic webcam frames.

The main entry point is ``calculate_focus_score``. It expects one webcam frame
at a time, extracts face/head/eye/gaze signals, and returns a normalized focus
payload that can be sent to the raid sync loop.
"""

from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module
from math import atan2, degrees, sqrt
from statistics import fmean
from typing import Any, Dict, MutableSequence, Optional, Sequence


@dataclass(frozen=True)
class FocusScoreConfig:
    """Tunable thresholds for webcam focus scoring."""

    rolling_window: int = 5
    focused_threshold: float = 0.75
    distracted_threshold: float = 0.50

    yaw_ok_degrees: float = 15.0
    yaw_max_degrees: float = 45.0
    pitch_ok_degrees: float = 12.0
    pitch_max_degrees: float = 35.0
    roll_ok_degrees: float = 12.0
    roll_max_degrees: float = 35.0

    eye_closed_ear: float = 0.15
    eye_open_ear: float = 0.23

    gaze_center_tolerance_x: float = 0.22
    gaze_max_offset_x: float = 0.42
    gaze_center_tolerance_y: float = 0.25
    gaze_max_offset_y: float = 0.48


LEFT_EYE_EAR = (33, 160, 158, 133, 153, 144)
RIGHT_EYE_EAR = (362, 385, 387, 263, 373, 380)
LEFT_EYE_BOX = (33, 133, 159, 145)
RIGHT_EYE_BOX = (362, 263, 386, 374)
LEFT_IRIS = (468, 469, 470, 471, 472)
RIGHT_IRIS = (473, 474, 475, 476, 477)

HEAD_POSE_LANDMARKS = (1, 152, 33, 263, 61, 291)
HEAD_POSE_MODEL_POINTS = (
    (0.0, 0.0, 0.0),  # nose tip
    (0.0, -63.6, -12.5),  # chin
    (-43.3, 32.7, -26.0),  # left eye outer corner
    (43.3, 32.7, -26.0),  # right eye outer corner
    (-28.9, -28.9, -24.1),  # left mouth corner
    (28.9, -28.9, -24.1),  # right mouth corner
)


def calculate_focus_score(
    frame: Any,
    rolling_scores: Optional[MutableSequence[float]] = None,
    *,
    frame_is_bgr: bool = True,
    config: Optional[FocusScoreConfig] = None,
) -> Dict[str, Any]:
    """Calculate focus status and signal scores from one webcam frame.

    Args:
        frame: A webcam image frame as a NumPy array. OpenCV frames are BGR by
            default; set ``frame_is_bgr=False`` if the input is already RGB.
        rolling_scores: Optional mutable list kept by the caller across frames.
            The current score is appended and the list is trimmed to the
            configured rolling window.
        frame_is_bgr: Whether ``frame`` uses OpenCV's BGR channel order.
        config: Optional scoring thresholds.

    Returns:
        A dictionary containing ``status``, ``focus_score``,
        ``rolling_focus_score``, and nested ``signals`` values for
        ``face_presence``, ``head_pose``, ``gaze``, and ``eyes_open``.
    """

    cfg = config or FocusScoreConfig()
    cv2, face_mesh_module, np = _load_vision_modules()

    if frame is None:
        return _build_payload(0.0, 0.0, 0.0, 0.0, rolling_scores, cfg)

    image = np.asarray(frame)
    if image.ndim != 3 or image.shape[2] < 3:
        raise ValueError("frame must be a color image shaped like (height, width, channels)")

    height, width = image.shape[:2]
    rgb_frame = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if frame_is_bgr else image
    rgb_frame.flags.writeable = False

    face_mesh = face_mesh_module.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.50,
    )

    try:
        result = face_mesh.process(rgb_frame)
    finally:
        face_mesh.close()

    if not result.multi_face_landmarks:
        return _build_payload(0.0, 0.0, 0.0, 0.0, rolling_scores, cfg)

    landmarks = result.multi_face_landmarks[0].landmark
    points = _landmarks_to_points(landmarks, width, height, np)

    face_presence = _score_face_presence(points, width, height)
    head_pose = _score_head_pose(points, width, height, cv2, np, cfg)
    eyes_open = _score_eyes_open(points, cfg)
    gaze = _score_gaze(points, head_pose, cfg, np)

    return _build_payload(face_presence, head_pose, gaze, eyes_open, rolling_scores, cfg)


def _load_vision_modules() -> tuple[Any, Any, Any]:
    try:
        import cv2
        import mediapipe as mp
        import numpy as np
    except ImportError as exc:
        raise ImportError(
            "calculate_focus_score requires opencv-python, mediapipe, and numpy. "
            "Install them in the environment that processes webcam snapshots."
        ) from exc

    try:
        face_mesh_module = mp.solutions.face_mesh
    except AttributeError:
        try:
            face_mesh_module = import_module("mediapipe.python.solutions.face_mesh")
        except ImportError as exc:
            raise ImportError(
                "The installed mediapipe package does not expose FaceMesh. "
                "Try reinstalling mediapipe in this Python environment."
            ) from exc

    return cv2, face_mesh_module, np


def _build_payload(
    face_presence: float,
    head_pose: float,
    gaze: float,
    eyes_open: float,
    rolling_scores: Optional[MutableSequence[float]],
    config: FocusScoreConfig,
) -> Dict[str, Any]:
    signals = {
        "face_presence": round(_clamp(face_presence), 4),
        "head_pose": round(_clamp(head_pose), 4),
        "gaze": round(_clamp(gaze), 4),
        "eyes_open": round(_clamp(eyes_open), 4),
    }

    focus_score = (
        0.25 * signals["face_presence"]
        + 0.25 * signals["head_pose"]
        + 0.35 * signals["gaze"]
        + 0.15 * signals["eyes_open"]
    )
    focus_score = round(_clamp(focus_score), 4)

    if rolling_scores is not None:
        rolling_scores.append(focus_score)
        del rolling_scores[:-config.rolling_window]
        rolling_focus_score = round(_clamp(fmean(rolling_scores)), 4)
    else:
        rolling_focus_score = focus_score

    if rolling_focus_score >= config.focused_threshold:
        status = "FOCUSED"
    elif rolling_focus_score < config.distracted_threshold:
        status = "DISTRACTED"
    else:
        status = "UNCERTAIN"

    return {
        "status": status,
        "focus_score": focus_score,
        "rolling_focus_score": rolling_focus_score,
        "signals": signals,
    }


def _landmarks_to_points(landmarks: Sequence[Any], width: int, height: int, np: Any) -> Any:
    return np.array([(lm.x * width, lm.y * height, lm.z) for lm in landmarks], dtype=np.float64)


def _score_face_presence(points: Any, width: int, height: int) -> float:
    x_min, y_min = points[:, 0].min(), points[:, 1].min()
    x_max, y_max = points[:, 0].max(), points[:, 1].max()
    face_area_ratio = ((x_max - x_min) * (y_max - y_min)) / float(width * height)

    # Very tiny faces are unreliable; normal seated webcam framing saturates to 1.
    return _scale_between(face_area_ratio, low=0.015, high=0.080)


def _score_head_pose(
    points: Any,
    width: int,
    height: int,
    cv2: Any,
    np: Any,
    config: FocusScoreConfig,
) -> float:
    image_points = np.array([points[index, :2] for index in HEAD_POSE_LANDMARKS], dtype=np.float64)
    model_points = np.array(HEAD_POSE_MODEL_POINTS, dtype=np.float64)
    focal_length = float(width)
    camera_matrix = np.array(
        ((focal_length, 0.0, width / 2.0), (0.0, focal_length, height / 2.0), (0.0, 0.0, 1.0)),
        dtype=np.float64,
    )
    distortion = np.zeros((4, 1), dtype=np.float64)

    success, rotation_vector, _ = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        distortion,
        flags=cv2.SOLVEPNP_ITERATIVE,
    )
    if not success:
        return 0.0

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    pitch, yaw, roll = _rotation_matrix_to_euler(rotation_matrix)

    yaw_score = _angle_score(yaw, config.yaw_ok_degrees, config.yaw_max_degrees)
    pitch_score = _angle_score(pitch, config.pitch_ok_degrees, config.pitch_max_degrees)
    roll_score = _angle_score(roll, config.roll_ok_degrees, config.roll_max_degrees)

    return 0.55 * yaw_score + 0.35 * pitch_score + 0.10 * roll_score


def _rotation_matrix_to_euler(rotation_matrix: Any) -> tuple[float, float, float]:
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
    left_ear = _eye_aspect_ratio(points, LEFT_EYE_EAR)
    right_ear = _eye_aspect_ratio(points, RIGHT_EYE_EAR)
    average_ear = (left_ear + right_ear) / 2.0

    return _scale_between(average_ear, low=config.eye_closed_ear, high=config.eye_open_ear)


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

    left_score = _single_eye_gaze_score(points, LEFT_EYE_BOX, LEFT_IRIS, config, np)
    right_score = _single_eye_gaze_score(points, RIGHT_EYE_BOX, RIGHT_IRIS, config, np)

    if left_score is None or right_score is None:
        return head_pose_score

    iris_score = (left_score + right_score) / 2.0

    # Head direction is a stabilizer because iris-only gaze is noisy on webcams.
    return 0.75 * iris_score + 0.25 * head_pose_score


def _single_eye_gaze_score(
    points: Any,
    eye_indices: Sequence[int],
    iris_indices: Sequence[int],
    config: FocusScoreConfig,
    np: Any,
) -> Optional[float]:
    eye_points = np.array([points[index, :2] for index in eye_indices], dtype=np.float64)
    iris_center = np.array([points[index, :2] for index in iris_indices], dtype=np.float64).mean(axis=0)

    x_min, y_min = eye_points.min(axis=0)
    x_max, y_max = eye_points.max(axis=0)
    eye_width = x_max - x_min
    eye_height = y_max - y_min

    if eye_width <= 0 or eye_height <= 0:
        return None

    x_ratio = (iris_center[0] - x_min) / eye_width
    y_ratio = (iris_center[1] - y_min) / eye_height

    x_offset = abs(float(x_ratio) - 0.5)
    y_offset = abs(float(y_ratio) - 0.5)

    x_score = _offset_score(
        x_offset,
        config.gaze_center_tolerance_x,
        config.gaze_max_offset_x,
    )
    y_score = _offset_score(
        y_offset,
        config.gaze_center_tolerance_y,
        config.gaze_max_offset_y,
    )

    return 0.75 * x_score + 0.25 * y_score


def _angle_score(angle_degrees: float, ok_degrees: float, max_degrees: float) -> float:
    return _offset_score(abs(angle_degrees), ok_degrees, max_degrees)


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
