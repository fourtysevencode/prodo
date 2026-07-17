# Desktop Client Documentation (Tauri & Python)

## 1. Overview
The Prodo Desktop Client is the core "Enforcer" of the gamified focus engine for Windows and macOS. It is built using **Tauri**, but uniquely, the **entire backend is written in Python**.

The Tauri/Rust layer exists *only* to satisfy the requirements of running a cross-platform desktop UI window. Every piece of core logic—from Computer Vision to OS-level hooks, the state machine, and local database management—is handled by the Python backend.

## 2. Tech Stack
- **Framework**: Tauri 2.0+ (Acts purely as a window/UI wrapper).
- **Frontend**: React / Next.js / Vue (Depending on team preference) - *This exact codebase will be used for the Web App*.
- **Backend (Python)**: The true engine of the desktop app. Handles all logic, OS hooks, and database operations.
- **Computer Vision**: Periodic image captures (every 3-5 seconds) offloaded via WebRTC/HTTP to a HuggingFace Spaces server.
- **Local Database**: SQLite (managed via Python `sqlite3` or `SQLAlchemy`).

## 3. The Core Loop (Python Backend)
The Python backend runs a continuous state machine thread that manages the economy loop entirely independently of the UI.

### A. Computer Vision Tracking (HuggingFace Spaces)
- **The Tracker**: The local Python process captures webcam snapshots at a set interval (every 3 to 5 seconds) and transmits them to HuggingFace Spaces for gaze and head mesh inference.
- **Efficiency**: Offloading inference to HuggingFace avoids high local CPU usage and saves on Cloudflare Workers' daily requests.
- **The Grace Period**: If the HuggingFace Spaces model reports that the user has looked away, the Python state machine starts a 15-second grace period timer. If focus is restored before the timer hits zero, the streak continues.

### B. OS Hooks & Context-Aware Allowlisting
- **Active Window Monitoring**: Python uses OS-specific libraries (like `psutil`, `pygetwindow`, or native ctypes) to read the title and executable name of the currently active window.
- **Context Awareness**: Python parses window titles. "YouTube - React Tutorial" (Allowed) is treated differently than "YouTube - MrBeast" (Penalized).
- **Enforcement**: If a user is distracted and their points drop into the negative, Python executes the punishment (e.g., forcefully minimizing restricted apps, modifying the local hosts file, or locking the screen).

### C. The Economy & Point Tracking
- As long as CV confirms the user is looking at the screen AND the active window is productive, the Python state machine increases a point multiplier.
- Points are continuously written to the local SQLite database by Python to prevent data loss.
- Users can "spend" points via the UI, which signals Python to add a specific app to the active allowlist for a set duration.

## 4. Inter-Process Communication (IPC)
Because the heavy lifting is in Python and the UI is in Tauri, the architecture relies on IPC to bridge the gap.

### A. Python <-> Tauri (The Bridge)
- **Execution**: The Tauri (Rust) layer's only true backend responsibility is to spawn the Python backend as a child process when the application starts, and ensure it terminates when the app closes.
- **Data Flow**: The Python process communicates with the Tauri layer via standard IPC (e.g., standard I/O streams, local websockets, or a local HTTP server).
- **Updates**: Python sends state updates (current points, multiplier, grace period countdowns) to Tauri, which Tauri immediately forwards to the Web UI via its asynchronous event system.
- **Commands**: When a user clicks "Buy Reward" in the UI, the Web frontend sends an event to Tauri, which forwards the command to the Python backend to deduct points and update the allowlist.
