# Mobile App Documentation (Android)

## 1. Overview
The Prodo Mobile App for Android serves two purposes: it acts as a companion app for checking stats and managing social interactions (friends, co-op lobbies), and it functions as a standalone Focus Enforcer when the user is studying or working away from their PC.

Because it operates as an enforcer, the mobile app also includes Computer Vision capabilities to track user gaze, ensuring parity with the desktop experience.

## 2. Tech Stack
- **Framework**: Kotlin (Native) or React Native (if sharing UI components with the Web/Desktop is heavily prioritized).
- **Computer Vision**: HuggingFace Spaces ML API. The app captures snapshots every 3-5 seconds and transmits them via WebRTC/HTTP. (Local fallback: Google ML Kit Face Detection API for offline/local-only mode).
- **Local Persistence**: Room (for Native Android) or SQLite.
- **Background Tasks**: WorkManager for syncing offline points back to the FastAPI backend.

## 3. Core Mobile Loop: The CV Enforcer
Just like the desktop client, the mobile app requires the user to remain engaged to earn points.

### A. Mobile Vision Pipeline (HuggingFace Spaces)
- When a mobile focus session is initiated, the app captures camera snapshots at a set interval (every 3 to 5 seconds).
- These snapshots are streamed to the HuggingFace Spaces server via WebRTC/HTTP to analyze gaze and head positions.
- If the HuggingFace server detects that the user has looked away and they do not return within the 15-second grace period, the streak is broken and penalties apply.

### B. Fallback Mechanisms (Performance & Battery)
Running continuous CV on a mobile device can drain the battery rapidly or overheat older hardware. Prodo implements a graceful degradation strategy:
- **CV Mode (High Power)**: Uses the camera and ML Kit. Best for short, intense sessions where the phone is plugged in or resting on a stand.
- **Sensor Mode (Low Power / Fallback)**: If the user opts out of CV or the device is struggling, the app falls back to an alternative monitoring system.
  - **Screen Time / App Usage APIs**: The app ensures Prodo (or an allowed reading app) remains the active foreground application.
  - **Accelerometer / Gyroscope**: The app monitors micro-movements to ensure the phone is actually being held or used, preventing users from simply leaving the screen on and walking away.

## 4. Mobile OS Hooks & Punishments
Android has strict limitations on what a background app can do, meaning punishments differ from the desktop version.

- **App Blocking**: Using Android's `AccessibilityService` or `UsageStatsManager`, Prodo can detect when a user opens a restricted app (like TikTok) during a focus session and immediately draw an overlay over it, forcing them back to Prodo.
- **Social/Financial Penalties**: Since OS-level control is limited, punishments heavily rely on the backend economy. Breaking focus immediately triggers an API call to deduct points or alert the Co-op Raid team.

## 5. Companion Features
When not actively enforcing a focus session, the app serves as the main hub:
- **Push Notifications**: Receive alerts when a friend breaks focus in a raid, or when you receive a co-op invite.
- **The Shop**: Purchase allowlist time for the desktop PC while away from the keyboard.
- **Leaderboards & Profile**: View global rankings and friend statuses natively.
