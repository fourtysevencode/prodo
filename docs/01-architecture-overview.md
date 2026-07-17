# Architecture Overview: Prodo Gamified Focus Engine

## 1. The Core Concept
Prodo is a Gamified Focus Engine that actively monitors user attention and rewards sustained focus while heavily penalizing distractions. Unlike traditional, rigid app blockers, Prodo functions as a strict but intelligent economy.

- **Earn Points**: Accumulate points for deep work. The longer the unbroken streak, the higher the point multiplier.
- **Spend Points**: Points are currency used to "purchase" temporary allowlist windows for pure entertainment (e.g., Netflix, TikTok, gaming). 
- **Utility is Free**: Utility tools (email, IDEs) are never penalized and cost no points.
- **Punishments**: Breaking focus without spending points drops the score into the negative, forcing consequences (OS-level lockouts, social notifications, or financial micro-donations).

## 2. Key Differentiators
- **Intelligent Vision Pipeline**: To manage device resources and bypass API request limits on Cloudflare, CV processing (head position and gaze tracking) is delegated to a dedicated HuggingFace Spaces server. The clients stream periodic snapshots (one frame every 3 to 5 seconds) to HuggingFace.
- **Grace Period Buffer**: Looking away triggers a 15-second grace period. If focus returns before zero, the streak continues.
- **Context-Aware Allowlisting**: Differentiates between productive and distracting contexts within the same app (e.g., "YouTube - React Tutorial" vs "YouTube - MrBeast").
- **Co-op Boss Fights (Multiplayer)**: Synchronized deep-work sprints with friends. If one person breaks focus, the entire team takes a penalty.

## 3. High-Level System Architecture

The Prodo ecosystem consists of four main components interacting in real-time:

### A. Desktop Client (Tauri & Python - Windows/macOS)
- **Framework**: Tauri (Rust wrapper for UI) + Python (Core Engine)
- **Role**: The primary "Enforcer" for desktop users.
- **Frontend**: A web-based UI (HTML/CSS/JS) that displays the current multiplier, points, and allowlist shop.
- **Backend (Python)**: Handles OS-level hooks, the state machine, the SQLite database, and captures/packages periodic webcam snapshots (every 3 to 5 seconds) to be streamed to the HuggingFace Spaces server.

### B. Mobile App (Android)
- **Role**: Focus enforcement on the go, companion features, and social coordination.
- **Features**: Periodically captures camera snapshots (every 3 to 5 seconds) and sends them to the HuggingFace Spaces server for focus analysis.
- **Graceful Degradation**: If network connectivity or battery is constrained, it falls back to local Sensor Mode (Screen Time APIs + Accelerometer data) to track active engagement without sending images.

### C. Web App
- **Role**: The accessible dashboard.
- **Architecture**: A direct port of the Tauri desktop frontend, stripped of the local CV and OS hook features. It serves to view leaderboards, manage friends, and adjust account settings from any device.

### D. Cloud Backend (FastAPI on Cloudflare Workers)
- **Role**: The "Sync & Social Layer".
- **Responsibilities**: Handles user authentication, global and friend leaderboards, and the state syncing for Co-op Raids.
- **Daily Request Optimization**: By routing heavy image/video frames to HuggingFace Spaces rather than Cloudflare, the backend avoids hitting Cloudflare Worker daily request limits.

### E. CV Server (HuggingFace Spaces)
- **Role**: Dedicated ML inference API.
- **Responsibilities**: Hosts the Python-based computer vision models (OpenCV/MediaPipe) to detect head position and gaze, validating whether the user is focused based on the incoming periodic snapshots (every 3-5s).

## 4. The Data Flow
1. **Periodic Captures**: The Desktop/Mobile client captures a webcam/camera snapshot every 3 to 5 seconds.
2. **HuggingFace Inference**: The image is sent to the HuggingFace Spaces server.
3. **State Machine**: The local client receives the focus validation result from HuggingFace, updating the local state machine (points, multiplier, and grace period).
4. **Local Persistence**: Focus data is saved to a local SQLite database.
5. **Cloud Syncing**: Periodic, lightweight API requests are sent to the Cloudflare Workers backend to update global/friend leaderboard states and sync multiplayer raids.
