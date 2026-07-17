import sys
import time
import json
import subprocess
import os

BLACKLIST = {
    "youtube": ["youtube.com", "youtube", "yt"],
    "reddit": ["reddit.com", "reddit"],
    "netflix": ["netflix.com", "netflix"],
    "tiktok": ["tiktok.com", "tiktok"],
    "steam": ["steam", "valheim", "cyberpunk", "counter-strike"],
    "discord": ["discord"],
    "spotify": ["spotify"]
}

def get_frontmost_window_mac():
    script = """
    tell application "System Events"
        try
            set frontmostProcess to first process whose frontmost is true
            set processName to name of frontmostProcess
            try
                set windowTitle to name of window 1 of frontmostProcess
            on error
                set windowTitle to ""
            end try
            return processName & "|||" & windowTitle
        on error
            return ""
        end try
    end tell
    """
    try:
        proc = subprocess.Popen(['osascript', '-e', script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, _ = proc.communicate(timeout=0.8)
        return out.decode('utf-8', errors='ignore').strip()
    except Exception:
        return ""

def hide_process_mac(app_name):
    script = f'tell application "System Events" to set visible of process "{app_name}" to false'
    try:
        subprocess.run(['osascript', '-e', script], timeout=0.8)
    except Exception:
        pass

def main():
    print("Prodo Desktop Python Backend Initialized", file=sys.stderr)
    # allowlist.json is written by the frontend in the same folder during development
    allowlist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "allowlist.json")

    while True:
        # Load allowlist of currently purchased/unlocked app IDs
        allowed_apps = []
        try:
            if os.path.exists(allowlist_path):
                with open(allowlist_path, "r") as f:
                    allowed_apps = json.load(f)
        except Exception as e:
            print(f"Error loading allowlist: {e}", file=sys.stderr)

        # Get frontmost active app details
        front = get_frontmost_window_mac()
        if front and "|||" in front:
            app_name, title = front.split("|||", 1)
            app_name_lower = app_name.lower()
            title_lower = title.lower()

            # Check if active app matches any blacklisted item
            for app_id, patterns in BLACKLIST.items():
                is_distraction = False
                for pattern in patterns:
                    if pattern in app_name_lower or pattern in title_lower:
                        is_distraction = True
                        break

                if is_distraction:
                    # If this distracting app is NOT in the allowlist, block (minimize) it
                    if app_id not in allowed_apps:
                        print(f"BLOCKING unapproved app: {app_name} ({title})", file=sys.stderr)
                        hide_process_mac(app_name)
                        
                        # Emit a JSON log that the frontend can read if it hooks stdin/stdout,
                        # or just write it to standard out.
                        log_msg = {
                            "type": "SYSTEM",
                            "code": "ERR_BLOCKED",
                            "message": f"Blocked unapproved access to {app_name} (Title: {title})."
                        }
                        print(json.dumps(log_msg))
                        sys.stdout.flush()

        time.sleep(1)

if __name__ == "__main__":
    main()
