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

def get_browser_tab_mac(app_name):
    app_name_lower = app_name.lower()
    script = None
    if "chrome" in app_name_lower or "chromium" in app_name_lower:
        script = 'tell application "Google Chrome" to get URL of active tab of front window'
    elif "safari" in app_name_lower:
        script = 'tell application "Safari" to get URL of document 1'
    elif "arc" in app_name_lower:
        script = 'tell application "Arc" to get URL of active tab of front window'
    elif "edge" in app_name_lower:
        script = 'tell application "Microsoft Edge" to get URL of active tab of front window'
    
    if not script:
        return ""

    try:
        proc = subprocess.Popen(['osascript', '-e', script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, _ = proc.communicate(timeout=0.8)
        return out.decode('utf-8', errors='ignore').strip()
    except Exception:
        return ""

def get_foreground_window_win():
    try:
        import ctypes
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32

        hwnd = user32.GetForegroundWindow()
        if not hwnd:
            return "", ""

        # Get window title
        length = user32.GetWindowTextLengthW(hwnd)
        buf = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buf, length + 1)
        window_title = buf.value

        # Get process executable name
        pid = ctypes.c_ulong()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        
        PROCESS_QUERY_INFORMATION = 0x0400
        PROCESS_VM_READ = 0x0010
        h_process = kernel32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, False, pid.value)
        process_name = ""
        if h_process:
            buf_name = ctypes.create_unicode_buffer(260)
            size = ctypes.c_ulong(260)
            if kernel32.QueryFullProcessImageNameW(h_process, 0, buf_name, ctypes.byref(size)):
                process_name = os.path.basename(buf_name.value)
            kernel32.CloseHandle(h_process)
            
        return process_name, window_title
    except Exception:
        return "", ""

def main():
    print("Prodo Cross-Platform Desktop Window Blocker Initialized", file=sys.stderr)
    allowlist_path = os.path.join(os.path.dirname(__file__), "allowlist.json")
    penalty_path = os.path.join(os.path.dirname(__file__), "penalty.json")

    while True:
        # Load allowlist configuration
        allowed_apps = []
        tracking_active = False
        try:
            if os.path.exists(allowlist_path):
                with open(allowlist_path, "r") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        allowed_apps = data.get("allowed_apps", [])
                        tracking_active = data.get("tracking_active", False)
                    else:
                        allowed_apps = data
                        tracking_active = True
        except Exception as e:
            print(f"Error loading allowlist: {e}", file=sys.stderr)

        if not tracking_active:
            time.sleep(1)
            continue

        # Get frontmost active app details depending on platform
        app_name = ""
        title = ""
        tab_url = ""

        if sys.platform == "darwin":
            front = get_frontmost_window_mac()
            if front and "|||" in front:
                app_name, title = front.split("|||", 1)
                tab_url = get_browser_tab_mac(app_name)
        elif sys.platform == "win32":
            app_name, title = get_foreground_window_win()

        app_name_lower = app_name.lower()
        title_lower = title.lower()
        tab_url_lower = tab_url.lower()

        # Check if active app matches any blacklisted item
        for app_id, patterns in BLACKLIST.items():
            is_distraction = False
            for pattern in patterns:
                if pattern in app_name_lower or pattern in title_lower or pattern in tab_url_lower:
                    is_distraction = True
                    break

            if is_distraction:
                # If this distracting app is NOT in the allowlist, apply heavy negative XP penalty
                if app_id not in allowed_apps:
                    print(f"DISTRACTION DETECTED: {app_name} | {title} | {tab_url}", file=sys.stderr)
                    
                    # Write continuous -150 XP penalty to penalty.json
                    try:
                        # If a penalty is already pending, accumulate it
                        current_penalty = 0
                        if os.path.exists(penalty_path):
                            with open(penalty_path, "r") as f:
                                current_penalty = int(f.read().strip() or 0)
                        
                        with open(penalty_path, "w") as f:
                            f.write(str(current_penalty - 150))
                    except Exception as e:
                        print(f"Error writing penalty: {e}", file=sys.stderr)

        time.sleep(1)

if __name__ == "__main__":
    main()
