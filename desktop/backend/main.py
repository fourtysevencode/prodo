import sys
import time
import json

def main():
    print("Prodo Desktop Python Backend Initialized", file=sys.stderr)
    # The core focus engine loop goes here.
    # This process will communicate with Tauri via standard I/O (stdout/stderr).
    while True:
        # Example output structure sent to Tauri
        state = {
            "status": "FOCUSED",
            "multiplier": 1.0,
            "points": 0
        }
        print(json.dumps(state))
        sys.stdout.flush()
        time.sleep(1)

if __name__ == "__main__":
    main()
