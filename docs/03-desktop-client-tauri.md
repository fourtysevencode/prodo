# Desktop Client Documentation (Tauri)

## 1. Overview
The Prodo Desktop Client is the core "Enforcer" of the gamified focus engine for Windows and macOS. It is built using **Tauri**, which provides an incredibly lightweight footprint by pairing a Rust backend (for OS-level operations) with a standard web frontend (HTML/CSS/JS).

This architecture was specifically chosen to allow the frontend UI to be built once and effortlessly ported to the Prodo Web Dashboard.

## 2. Tech Stack
- **Framework**: Tauri 2.0+
- **Frontend**: React / Next.js / Vue (Depending on team preference) - *This exact codebase will be used for the Web App*.
- **Backend**: Rust
- **Computer Vision**: OpenCV bindings for Rust or a bundled Python sidecar (running MediaPipe) for MVP speed.
- **Local Database**: SQLite (via `sqlx` or `rusqlite` in Rust).

## 3. The Core Loop (Rust Backend)
The Rust backend runs a continuous state machine thread that manages the economy loop.

### A. Computer Vision Tracking
- **The Tracker**: A lightweight CV process checks the webcam stream for facial landmarks and gaze direction. 
- **Privacy**: Frames are processed entirely in memory and immediately discarded. No video is ever saved to disk or transmitted over the network.
- **The Grace Period**: If the CV detects the user looking away (e.g., checking a notebook), the Rust backend starts a 15-second grace period timer. If the user's gaze returns to the screen before the timer expires, the focus streak continues without penalty.

### B. OS Hooks & Context-Aware Allowlisting
- **Active Window Monitoring**: Rust uses OS-specific APIs (e.g., `windows-rs` on Windows, `core-graphics` on macOS) to read the title and executable name of the currently active window.
- **Context Awareness**: The system parses window titles. "YouTube - React Tutorial" (Allowed) is treated differently than "YouTube - MrBeast" (Penalized).
- **Enforcement**: If a user is distracted and their points drop into the negative, the Rust backend executes the punishment, which can include forcefully minimizing restricted apps, blocking network domains locally via the hosts file, or locking the screen.

### C. The Economy & Point Tracking
- As long as CV confirms the user is looking at the screen AND the active window is productive, a point multiplier slowly increases.
- Points are continuously written to the local SQLite database to prevent loss during crashes or unexpected closures.
- Users can "spend" points via the UI. When spent, the Rust backend adds a specific app (e.g., Spotify, a game) to the allowlist for a set duration (e.g., 15 minutes).

## 4. Frontend-Backend IPC (Inter-Process Communication)
Tauri uses an asynchronous event system to communicate between the Rust backend and the Web UI.

- **Rust -> Web**: Rust emits events (e.g., `points-updated`, `grace-period-started`, `punishment-triggered`) which the frontend listens to in order to update the UI (the shop, the multiplier display).
- **Web -> Rust**: The frontend invokes Rust commands (e.g., `invoke('purchase_reward', { app_id: 'netflix', minutes: 15 })`). Rust verifies the point balance, deducts it locally, and updates the internal OS hook allowlist.
