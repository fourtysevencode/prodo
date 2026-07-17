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
    current_focus_status_weight: float = 0.85
    rolling_focus_status_weight: float = 0.15

    face_presence_weight: float = 0.25
    head_pose_weight: float = 0.25
    gaze_weight: float = 0.35
    eyes_open_weight: float = 0.15

    yaw_ok_degrees: float = 15.0
    yaw_max_degrees: float = 45.0
    pitch_ok_degrees: float = 12.0
    pitch_max_degrees: float = 35.0
    pitch_down_ok_degrees: float = 25.0
    pitch_down_max_degrees: float = 55.0
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
    include_debug: bool = False,
    prefer_mediapipe: bool = True,
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
    cv2, face_mesh_module, np = _load_vision_modules(prefer_mediapipe=prefer_mediapipe)

    if frame is None:
        return _build_payload(
            0.0,
            0.0,
            0.0,
            0.0,
            rolling_scores,
            cfg,
        )

    image = np.asarray(frame)
    if image.ndim != 3 or image.shape[2] < 3:
        raise ValueError("frame must be a color image shaped like (height, width, channels)")

    if face_mesh_module is None:
        return _calculate_focus_score_with_opencv(
            image,
            rolling_scores,
            frame_is_bgr=frame_is_bgr,
            cv2=cv2,
            config=cfg,
            include_debug=include_debug,
        )

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
        return _build_payload(
            0.0,
            0.0,
            0.0,
            0.0,
            rolling_scores,
            cfg,
            debug={"backend": "mediapipe", "face_count": 0} if include_debug else None,
        )

    landmarks = result.multi_face_landmarks[0].landmark
    points = _landmarks_to_points(landmarks, width, height, np)

    face_presence = _score_face_presence(points, width, height)
    head_pose = _score_head_pose(points, width, height, cv2, np, cfg)
    eyes_open = _score_eyes_open(points, cfg)
    gaze = _score_gaze(points, head_pose, cfg, np)

    return _build_payload(
        face_presence,
        head_pose,
        gaze,
        eyes_open,
        rolling_scores,
        cfg,
        debug={"backend": "mediapipe", "face_count": 1} if include_debug else None,
    )


def _load_vision_modules(*, prefer_mediapipe: bool) -> tuple[Any, Any, Any]:
    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise ImportError(
            "calculate_focus_score requires opencv-python and numpy. "
            "Install them in the environment that processes webcam snapshots."
        ) from exc

    face_mesh_module = None
    if not prefer_mediapipe:
        return cv2, face_mesh_module, np

    try:
        import mediapipe as mp

        try:
            face_mesh_module = mp.solutions.face_mesh
        except AttributeError:
            for module_name in (
                "mediapipe.solutions.face_mesh",
                "mediapipe.python.solutions.face_mesh",
            ):
                try:
                    face_mesh_module = import_module(module_name)
                    break
                except ImportError:
                    continue
    except ImportError:
        face_mesh_module = None

    return cv2, face_mesh_module, np


def _calculate_focus_score_with_opencv(
    image: Any,
    rolling_scores: Optional[MutableSequence[float]],
    *,
    frame_is_bgr: bool,
    cv2: Any,
    config: FocusScoreConfig,
    include_debug: bool,
) -> Dict[str, Any]:
    gray_code = cv2.COLOR_BGR2GRAY if frame_is_bgr else cv2.COLOR_RGB2GRAY
    gray = cv2.cvtColor(image, gray_code)
    gray = cv2.equalizeHist(gray)
    height, width = gray.shape[:2]

    face_cascades = [
        cv2.CascadeClassifier(cv2.data.haarcascades + filename)
        for filename in (
            "haarcascade_frontalface_default.xml",
            "haarcascade_frontalface_alt2.xml",
            "haarcascade_profileface.xml",
        )
    ]
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")

    min_face_size = max(40, int(min(width, height) * 0.08))
    faces = []
    for face_cascade in face_cascades:
        if face_cascade.empty():
            continue

        detected = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(min_face_size, min_face_size),
        )
        faces.extend(tuple(face) for face in detected)

    if len(faces) == 0:
        return _build_payload(
            0.0,
            0.0,
            0.0,
            0.0,
            rolling_scores,
            config,
            debug={
                "backend": "opencv_haar",
                "face_count": 0,
                "min_face_size": min_face_size,
                "frame_size": [width, height],
            }
            if include_debug
            else None,
        )

    x, y, face_width, face_height = max(faces, key=lambda face: face[2] * face[3])
    face_area_ratio = (face_width * face_height) / float(width * height)
    face_presence = _scale_between(face_area_ratio, low=0.015, high=0.080)

    face_center_x = x + face_width / 2.0
    face_center_y = y + face_height / 2.0
    horizontal_offset = abs((face_center_x / width) - 0.5)
    vertical_delta = (face_center_y / height) - 0.48
    horizontal_score = _offset_score(horizontal_offset, ok_offset=0.14, max_offset=0.34)
    if vertical_delta > 0:
        vertical_score = _offset_score(vertical_delta, ok_offset=0.24, max_offset=0.45)
    else:
        vertical_score = _offset_score(abs(vertical_delta), ok_offset=0.16, max_offset=0.36)
    head_pose = 0.70 * horizontal_score + 0.30 * vertical_score

    face_gray = gray[y : y + face_height, x : x + face_width]
    eyes = eye_cascade.detectMultiScale(
        face_gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(18, 18),
    )
    eyes_open = _clamp(len(eyes) / 2.0)

    # Haar cascades do not provide iris position, so approximate gaze from
    # face position. Missing eyes remain strict, but do not erase a strong
    # downward-reading posture entirely.
    gaze = (0.80 * head_pose) if len(eyes) == 0 else (0.65 * head_pose + 0.35 * eyes_open)

    return _build_payload(
        face_presence,
        head_pose,
        gaze,
        eyes_open,
        rolling_scores,
        config,
        debug={
            "backend": "opencv_haar",
            "face_count": len(faces),
            "face_box": [int(x), int(y), int(face_width), int(face_height)],
            "eye_count": int(len(eyes)),
            "frame_size": [width, height],
        }
        if include_debug
        else None,
    )


def _build_payload(
    face_presence: float,
    head_pose: float,
    gaze: float,
    eyes_open: float,
    rolling_scores: Optional[MutableSequence[float]],
    config: FocusScoreConfig,
    debug: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    signals = {
        "face_presence": round(_clamp(face_presence), 4),
        "head_pose": round(_clamp(head_pose), 4),
        "gaze": round(_clamp(gaze), 4),
        "eyes_open": round(_clamp(eyes_open), 4),
    }

    total_weight = (
        config.face_presence_weight
        + config.head_pose_weight
        + config.gaze_weight
        + config.eyes_open_weight
    )
    focus_score = (
        config.face_presence_weight * signals["face_presence"]
        + config.head_pose_weight * signals["head_pose"]
        + config.gaze_weight * signals["gaze"]
        + config.eyes_open_weight * signals["eyes_open"]
    ) / total_weight
    focus_score = round(_clamp(focus_score), 4)

    if rolling_scores is not None:
        rolling_scores.append(focus_score)
        del rolling_scores[:-config.rolling_window]
        rolling_focus_score = round(_clamp(fmean(rolling_scores)), 4)
    else:
        rolling_focus_score = focus_score

    status_total_weight = config.current_focus_status_weight + config.rolling_focus_status_weight
    if status_total_weight <= 0:
        status_focus_score = focus_score
    else:
        status_focus_score = round(
            _clamp(
                (
                    config.current_focus_status_weight * focus_score
                    + config.rolling_focus_status_weight * rolling_focus_score
                )
                / status_total_weight
            ),
            4,
        )

    current_frame_has_no_focus_signal = (
        focus_score <= 0.05
        or (
            signals["face_presence"] <= 0.05
            and signals["head_pose"] <= 0.05
            and signals["gaze"] <= 0.05
            and signals["eyes_open"] <= 0.05
        )
    )

    if current_frame_has_no_focus_signal:
        status = "DISTRACTED"
    elif status_focus_score >= config.focused_threshold:
        status = "FOCUSED"
    elif status_focus_score < config.distracted_threshold:
        status = "DISTRACTED"
    else:
        status = "UNCERTAIN"

    payload = {
        "status": status,
        "focus_score": focus_score,
        "rolling_focus_score": rolling_focus_score,
        "signals": signals,
    }
    if debug is not None:
        payload["debug"] = debug

    return payload


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
    pitch_score = _pitch_score(pitch, config)
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


def _pitch_score(pitch_degrees: float, config: FocusScoreConfig) -> float:
    if pitch_degrees >= 0:
        return _offset_score(
            pitch_degrees,
            config.pitch_down_ok_degrees,
            config.pitch_down_max_degrees,
        )

    return _offset_score(
        abs(pitch_degrees),
        config.pitch_ok_degrees,
        config.pitch_max_degrees,
    )


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
