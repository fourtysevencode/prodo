# Architecture Overview: Prodo Gamified Focus Engine

## 1. The Core Concept
Prodo is a Gamified Focus Engine that actively monitors user attention and rewards sustained focus while heavily penalizing distractions. Unlike traditional, rigid app blockers, Prodo functions as a strict but intelligent economy.

- **Earn Points**: Accumulate points for deep work. The longer the unbroken streak, the higher the point multiplier.
- **Spend Points**: Points are currency used to "purchase" temporary allowlist windows for pure entertainment (e.g., Netflix, TikTok, gaming). 
- **Utility is Free**: Utility tools (email, IDEs) are never penalized and cost no points.
- **Punishments**: Breaking focus without spending points drops the score into the negative, forcing consequences (OS-level lockouts, social notifications, or financial micro-donations).

## 2. Key Differentiators
- **Local Computer Vision (CV)**: Head position and gaze tracking run entirely locally. No images or video feeds ever leave the user's device, ensuring complete privacy.
- **Grace Period Buffer**: Looking away triggers a 15-second grace period. If focus returns before zero, the streak continues.
- **Context-Aware Allowlisting**: Differentiates between productive and distracting contexts within the same app (e.g., "YouTube - React Tutorial" vs "YouTube - MrBeast").
- **Co-op Boss Fights (Multiplayer)**: Synchronized deep-work sprints with friends. If one person breaks focus, the entire team takes a penalty.

## 3. High-Level System Architecture

The Prodo ecosystem consists of four main components interacting in real-time:

### A. Desktop Client (Tauri - Windows/macOS)
- **Framework**: Tauri (Rust + Web Frontend)
- **Role**: The primary "Enforcer" for desktop users.
- **Frontend**: A web-based UI (HTML/CSS/JS) that displays the current multiplier, points, and allowlist shop.
- **Backend (Rust)**: Handles OS-level hooks to read active window titles and enforce application locks. Runs the CV pipeline (either natively via Rust OpenCV/MediaPipe bindings or via a bundled Python sidecar) to track facial presence and gaze.

### B. Mobile App (Android)
- **Role**: Focus enforcement on the go, companion features, and social coordination.
- **Features**: Includes local CV (via MLKit or similar lightweight mobile vision API) to track gaze. 
- **Graceful Degradation**: If CV is too intensive for older devices, it falls back to Screen Time APIs + Accelerometer data to ensure active engagement without battery drain.

### C. Web App
- **Role**: The accessible dashboard.
- **Architecture**: A direct port of the Tauri desktop frontend, stripped of the local CV and OS hook features. It serves to view leaderboards, manage friends, and adjust account settings from any device.

### D. Cloud Backend (FastAPI)
- **Role**: The "Sync & Social Layer".
- **Responsibilities**: Handles user authentication, global and friend leaderboards, and the state syncing for Co-op Raids. 
- **Privacy Note**: Strictly handles metadata and points. It **never** receives or processes video data.

## 4. The Data Flow
1. **Local Tracking**: The Desktop/Mobile client constantly polls the local CV engine and OS active window state.
2. **State Machine**: The local state machine updates the current point tally and multiplier.
3. **Local Persistence**: Data is saved to a local SQLite database to prevent loss on unexpected shutdowns.
4. **Cloud Syncing**: Lightweight API requests are sent to the FastAPI backend to update the user's score on the global leaderboard and sync multiplayer raid states.
