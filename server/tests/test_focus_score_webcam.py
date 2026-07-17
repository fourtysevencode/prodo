"""Manual webcam smoke test for the focus scorer.

Run from the repository root:

    python server/tests/test_focus_score_webcam.py

Stop with Ctrl+C. Add ``--preview`` if your OpenCV install supports windows.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path


os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from utils.focus_score import calculate_focus_score  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Try focus scoring with a local webcam.")
    parser.add_argument("--camera", type=int, default=0, help="OpenCV camera index.")
    parser.add_argument("--interval", type=float, default=3.0, help="Seconds between samples.")
    parser.add_argument("--preview", action="store_true", help="Show a webcam preview window.")
    parser.add_argument("--debug", action="store_true", help="Print backend detection details.")
    parser.add_argument("--mediapipe", action="store_true", help="Try MediaPipe FaceMesh first.")
    args = parser.parse_args()

    try:
        import cv2
    except ImportError:
        print("opencv-python-headless/opencv-python is required. Install server requirements first.")
        return 1

    capture = cv2.VideoCapture(args.camera)
    if not capture.isOpened():
        print(f"Could not open webcam at camera index {args.camera}.")
        return 1

    rolling_scores: list[float] = []
    next_sample_at = time.monotonic() + 1.0
    latest_debug: dict | None = None

    print("Webcam focus test running. Press Ctrl+C to quit.")
    if args.preview:
        print("Preview enabled. Press q in the preview window to quit.")
    print("The first score can take a little while while the vision model initializes.")

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                print("Could not read a frame from the webcam.")
                return 1

            if args.preview:
                preview_frame = frame.copy()
                if latest_debug and latest_debug.get("face_box"):
                    x, y, width, height = latest_debug["face_box"]
                    cv2.rectangle(
                        preview_frame,
                        (x, y),
                        (x + width, y + height),
                        (0, 255, 0),
                        2,
                    )
                cv2.imshow("Prodo focus score test", preview_frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
            else:
                time.sleep(0.01)

            now = time.monotonic()
            if now >= next_sample_at:
                print("Calculating focus score...")
                result = calculate_focus_score(
                    frame,
                    rolling_scores,
                    include_debug=args.debug,
                    prefer_mediapipe=args.mediapipe,
                )
                latest_debug = result.get("debug")
                print(json.dumps(result, indent=2))
                next_sample_at = time.monotonic() + args.interval
    finally:
        capture.release()
        cv2.destroyAllWindows()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
