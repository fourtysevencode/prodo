# Prodo: The Gamified Focus Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Prodo** is a Gamified Focus Engine that actively monitors user attention and rewards sustained focus while heavily penalizing distractions. Traditional app blockers fail because they are rigid and context-blind—users get annoyed when blocked from a necessary tool and inevitably uninstall the blocker. Prodo functions as a strict but intelligent economy where your attention is currency.

---

## Table of Contents
- [1. Core Concept & Differentiators](#1-core-concept--differentiators)
- [2. System Architecture Overview](#2-system-architecture-overview)
- [3. Component Deep Dive](#3-component-deep-dive)
  - [A. Cloud API Backend (FastAPI Python)](#a-cloud-api-backend-fastapi-python)
  - [B. Desktop Client (Tauri & Python)](#b-desktop-client-tauri--python)
  - [C. Web Dashboard Frontend](#c-web-dashboard-frontend)
  - [D. Mobile App (Android Companion & Enforcer)](#d-mobile-app-android-companion--enforcer)
  - [E. CV Inference Engine (HuggingFace & Modal)](#e-cv-inference-engine-huggingface--modal)
- [4. Data Flow & State Machine](#4-data-flow--state-machine)
- [5. Multiplayer Co-op Boss Fights](#5-multiplayer-co-op-boss-fights)
- [6. Judge Presentation & Live Demo Guide](#6-judge-presentation--live-demo-guide)
- [7. Deployment Guide](#7-deployment-guide)

---

## 1. Core Concept & Differentiators

Unlike rigid app blockers that rely purely on negative reinforcement, Prodo builds an incentive-driven focus economy:

- **Earn Points**: Accumulate XP points during uninterrupted focus intervals. The longer your unbroken streak, the higher your point multiplier (scaling up to 4.5x).
- **Spend Points**: Points are currency used to "purchase" temporary allowlist windows for entertainment (e.g., 30 mins of YouTube, Netflix, gaming). Utility tools (email, IDEs) are always free and unpenalized.
- **Grace Period Buffer**: Looking away for up to 15 seconds to check a physical notebook or stretch triggers a grace period countdown. Returning gaze before zero preserves your streak.
- **Context-Aware Allowlisting**: Differentiates between productive and distracting contexts within the same app (e.g., *YouTube - React Tutorial* is allowed, while *YouTube - MrBeast* is penalized) by reading OS window titles.
- **Co-op Boss Fights (Multiplayer)**: Synchronized deep-work sprints with friends. If one teammate breaks focus, the entire team takes a penalty, leveraging social accountability.
- **Punishments**: Breaking focus without spending points drops your score into the negative, executing penalties (OS window minimization, AI cognitive waivers, social alerts).

---

## 2. System Architecture Overview

The Prodo ecosystem consists of five interacting components:

```
┌───────────────────────────┐         Snapshots (3-5s)        ┌──────────────────────────┐
│   Desktop Client (Tauri)  │ ──────────────────────────────> │  CV Inference Engine     │
│   & Python State Engine   │ <────────────────────────────── │  (HuggingFace & Modal)   │
└─────────────┬─────────────┘         Gaze Telemetry          └──────────────────────────┘
              │                                                             ▲
              │ REST / WS Sync                                              │ Mobile Snapshots
              ▼                                                             │
┌───────────────────────────┐         REST / WS Sync          ┌─────────────┴────────────┐
│   Cloud API Backend       │ <─────────────────────────────> │  Mobile App (Android)    │
│   (FastAPI / Workers D1)  │                                 │  Native / React Native   │
└─────────────▲─────────────┘                                 └──────────────────────────┘
              │ REST
┌─────────────┴────────────┐
│   Web Dashboard          │
│   (prodo.live React)     │
└──────────────────────────┘
```

---

## 3. Component Deep Dive

### A. Cloud API Backend (FastAPI Python)
The central source of truth for authentication, user profiles, social friend networks, global leaderboards, and co-op room states.

- **Tech Stack**: **FastAPI (Python 3.11+)** running on **Cloudflare Workers** (via Pyodide entrypoint) with **Cloudflare D1** SQLite storage.
- **Database Schema**:
  - `users`: User profiles, email, password hash, total lifetime XP, current spendable balance, auth tokens, developer flags.
  - `friends` & `friend_requests`: Reciprocal friendships and friend request state tracking.
  - `coop_sessions`: Active and historical multiplayer focus raid sessions.
  - `telemetry_logs`: High-frequency gaze telemetry and infraction logs.
  - `device_auths`: Seamless 6-character device OAuth authorization codes for desktop logins.
- **Key API Endpoints**:
  - `POST /auth/register` & `POST /auth/login`: User account creation & authentication.
  - `POST /auth/device-code` & `/auth/device-poll`: Desktop OAuth pairing.
  - `GET /users/me` & `POST /users/sync`: Profile fetching and periodic XP sync.
  - `GET /leaderboard/global` & `/leaderboard/friends`: Rankings by focus XP.
  - `POST /coop/create`, `/coop/join`, `/coop/end`: Co-op raid lobby management.
  - `POST /ai/generate-punishment` & `/ai/verify-punishment`: Whimsical AI challenge generation and validation.

### B. Desktop Client (Tauri & Python)
The primary "Enforcer" for Windows and macOS environments.

- **Tech Stack**: **Tauri 2.0+** (Rust window runner) + **Python 3.11** (Core Logic Engine) + **SQLite**.
- **Architecture**:
  - **Tauri/Rust**: Spawns and manages the Python background process via IPC stdio streams.
  - **Python Backend**: Captures webcam snapshots (every 3 to 5 seconds), monitors OS window titles via `psutil`/`pygetwindow`, executes local punishments, and updates local SQLite storage.

### C. Web Dashboard Frontend
The cloud-accessible web platform at `prodo.live` sharing the UI code with the Tauri desktop app.

- **Tech Stack**: **React / Vite / TailwindCSS** with a dark, neon-accented, whimsical design system.
- **Features**:
  - Interactive Focus HUD & Gaze Telemetry visualizer.
  - Distraction Vault & Break-time Shop.
  - Friends Directory & Multiplayer Lobby Joiner.
  - Global Leaderboard & AI Cognitive Waiver Challenges.

### D. Mobile App (Android Companion & Enforcer)
Provides focus enforcement on the go and mobile companion management.

- **Tech Stack**: **Kotlin Native / React Native** + **Room SQLite** + **WorkManager**.
- **Dual Pipeline Strategy**:
  - **CV Mode (High Power)**: Streams camera snapshots every 3-5 seconds to the inference API.
  - **Sensor Mode (Low Power Fallback)**: Monitors device accelerometer/gyroscope movement and foreground application state to prevent battery drain.
- **Android OS Hooks**: Uses Android `AccessibilityService` / `UsageStatsManager` to draw an overlay over restricted apps during focus sessions.

### E. CV Inference Engine (HuggingFace & Modal)
Dedicated machine learning serverless runners for heavy computer vision processing.

- **Tech Stack**: **FastAPI + MediaPipe + OpenCV + ONNXRuntime**.
- **Function**: Receives webcam frame snapshots, executes facial landmark and gaze direction analysis, and returns focus validation scores without consuming client CPU resources or hitting Cloudflare request limits.

---

## 4. Data Flow & State Machine

1. **Snapshot Capture**: Client captures a webcam frame snapshot every 3 to 5 seconds.
2. **ML Inference**: Frame is posted to the CV inference endpoint.
3. **Validation & State Update**: Gaze results update local state machine (multiplier, XP points, and 15-second grace period countdown).
4. **Local Persistence**: Data is written to local SQLite database.
5. **Cloud Sync**: Periodic lightweight API requests sync points to `api.prodo.live` to update global rankings.

---

## 5. Multiplayer Co-op Boss Fights

Co-op raids synchronize focus sprints across multiple friends:

1. **Lobby Creation**: Host creates a raid room and shares a 6-character code.
2. **Real-time Sync**: Connected clients emit status pings every 5 seconds.
3. **Peer Accountability**: If any team member gets distracted and breaks focus past the 15-second grace period, a team penalty is triggered across all connected clients.

---

## 6. Deployment Guide

Full step-by-step instructions for deploying Cloudflare Pages, Cloudflare Workers, and Modal runners are documented in [**DEPLOYMENT.md**](./DEPLOYMENT.md)
