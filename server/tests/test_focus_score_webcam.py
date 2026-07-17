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

    print("Webcam focus test running. Press Ctrl+C to quit.")
    if args.preview:
        print("Preview enabled. Press q in the preview window to quit.")
    print("The first score can take a little while because MediaPipe loads its model.")

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                print("Could not read a frame from the webcam.")
                return 1

            if args.preview:
                cv2.imshow("Prodo focus score test", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
            else:
                time.sleep(0.01)

            now = time.monotonic()
            if now >= next_sample_at:
                print("Calculating focus score...")
                result = calculate_focus_score(frame, rolling_scores)
                print(json.dumps(result, indent=2))
                next_sample_at = time.monotonic() + args.interval
    finally:
        capture.release()
        cv2.destroyAllWindows()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
