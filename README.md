# Prodo: The Gamified Focus Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Prodo** is a Gamified Focus Engine that actively monitors user attention and rewards sustained focus while heavily penalizing distractions. Traditional app blockers fail because they are rigid and context-blind. Prodo functions as a strict but intelligent economy where your attention is the currency.

## Core Concept

- **Earn Points**: Accumulate points for deep work. The longer your unbroken streak, the higher your point multiplier.
- **The Economy**: Points act as a currency. You can "purchase" temporary allowlist windows for pure entertainment (e.g., Netflix, TikTok, gaming). Utility tools (email, IDEs) are never penalized.
- **The Negative Loop**: If you break focus without spending points, you face immediate consequences ranging from OS-level app lockouts to social penalties.

## Key Differentiators

- **Intelligent Vision Pipeline**: To preserve local device performance and avoid daily Cloudflare Workers request limits, Prodo captures periodic webcam snapshots (every 3-5s) and offloads gaze/head landmarks to a dedicated HuggingFace Spaces server.
- **Grace Period Buffer**: Humans naturally look away from screens to check a notebook or stretch. If your eyes return within the 15-second grace period, your focus streak continues uninterrupted.
- **Context-Aware Allowlisting**: The system knows the difference between *YouTube - React Tutorial* (Allowed) and *YouTube - MrBeast* (Penalized) by reading OS window titles.
- **Co-op Boss Fights (Multiplayer)**: Link up with friends for a synchronized deep-work sprint. If one person breaks focus, the entire team takes a penalty, weaponizing social accountability.

## Architecture & Tech Stack

Prodo is a cross-platform ecosystem comprised of four main parts:

1. **Desktop Client (Windows/macOS)**: Built with a **Python** backend that handles local logic (OS Hooks, local database, periodic image capture) and uses **Tauri (Rust)** purely as a lightweight UI wrapper. Gaze and focus tracking are offloaded to HuggingFace Spaces.
2. **Mobile App (Android)**: A companion app and portable enforcer built with **Kotlin/React Native** utilizing Google ML Kit for on-device face detection and low-power fallbacks.
3. **Web Dashboard**: A cloud-accessible port of the desktop UI for checking leaderboards and managing friends.
4. **Cloud Backend**: A blazing-fast **FastAPI (Python)** server with **PostgreSQL** and **Redis** to handle the global economy, authentication, and real-time Co-op Raid state syncing.

## Documentation

Detailed documentation for each component of the system can be found in the `docs/` directory:

- [1. Architecture Overview & Core Concept](./docs/01-architecture-overview.md)
- [2. Backend (FastAPI)](./docs/02-backend-fastapi.md)
- [3. Desktop Client (Tauri & Python)](./docs/03-desktop-client.md)
- [4. Frontend Website](./docs/04-frontend-website.md)
- [5. Mobile App (Android)](./docs/05-mobile-app.md)
- [6. Presentation Guide for Judges](./docs/06-presentation-script.md)

---
*Built to redefine productivity by turning willpower into an economic incentive.*