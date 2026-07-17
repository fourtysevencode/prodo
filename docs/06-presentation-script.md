# Presentation Guide for Judges: Prodo

## The Pitch (Target Audience: Competition Judges)

**The Problem:** Traditional focus apps and website blockers fail because they are rigid and context-blind. Users install them, get annoyed when they are blocked from a necessary tool, and inevitably just uninstall the blocker. They rely purely on willpower and negative reinforcement.

**The Solution:** Prodo is a Gamified Focus Engine. We aren't just blocking websites; we are creating a strict but intelligent economy for your attention. By utilizing cloud-offloaded Computer Vision, we actively monitor your focus in real-time, rewarding deep work and penalizing distractions.

## Core Presentation Narrative

### 1. The Hook (0:00 - 1:00)
- **Question to Judges:** "How many times have you installed a website blocker, only to turn it off 20 minutes later because you needed to watch a YouTube tutorial for work?"
- **The Pivot:** Prodo solves this. It knows the difference between *productive context* and *pure entertainment*.

### 2. The Core Loop & The Economy (1:00 - 2:30)
- **Explain the Currency:** In Prodo, focus is currency. You earn points by maintaining a deep-work streak, tracked seamlessly via your webcam.
- **Explain the Shop:** You want to check TikTok or watch Netflix? You have to buy the time using the focus points you earned.
- **The Grace Period:** Mention the "human element." Looking away for 10 seconds to check a physical notebook won't ruin your streak, thanks to our 15-second grace period.
- **The Stick (Punishments):** If you try to cheat the system, your score drops into the negative, and Prodo strikes back—locking out apps or alerting your friends.

### 3. Key Differentiators & Technology (2:30 - 4:00)
*This is where you impress the technical judges.*
- **Optimized Hybrid Infrastructure:** Explain that by sending periodic snapshots (every 3-5 seconds) to a HuggingFace Spaces model backend, we protect the user's local battery/CPU while saving on Cloudflare Worker request costs.
- **Cross-Platform Ecosystem:**
  - **Desktop (Tauri + Python)**: For window tracking, local OS hooks, and periodic image capture.
  - **Mobile (Android)**: A companion and enforcer app configured to stream periodic snapshots.
  - **Cloud**: Cloudflare Workers (FastAPI) handles syncing leaderboards, while HuggingFace Spaces processes the vision pipeline.
- **Multiplayer (Co-op Boss Fights):** Highlight the social accountability. "You link up with 3 friends for a 2-hour sprint. If one person breaks focus, the whole team gets penalized. It weaponizes peer pressure for productivity."

### 4. The Live Demo Flow (4:00 - 5:30)
*(Have the Tauri desktop client open and the FastAPI backend running locally)*

1. **Start a Session:** Click "Start Focus" on the UI.
2. **Show the CV:** (Optional: have a small debug window showing the facial mesh tracking to prove it works).
3. **Show the Multiplier:** Look directly at the screen. Point out the multiplier going up in real-time.
4. **Trigger the Grace Period:** Look completely away from the monitor. Show the UI flash the 15-second warning countdown.
5. **Recover:** Look back before it hits zero. Show the streak continuing.
6. **Trigger a Punishment:** Open a restricted app (e.g., a known distracting website) without buying it in the shop. Show the OS hook instantly minimizing the window and deducting points.
7. **The Shop:** Use accumulated points to "buy" 5 minutes of YouTube. Show that the restriction is lifted temporarily.

### 5. Closing & Future (5:30 - 6:00)
- **Vision:** Prodo isn't just an app; it's a paradigm shift in how we manage digital diets. We're moving from passive blocking to active engagement and economic incentives.
- **Ask:** Thank the judges and open the floor for technical or product questions.
