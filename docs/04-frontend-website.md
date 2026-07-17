# Frontend Website Documentation

## 1. Overview
The Prodo Web Dashboard serves as the cloud-accessible hub for the user. Because the desktop client uses **Tauri**, the frontend codebase for the website and the desktop app is almost entirely shared. 

The critical difference is that the Web Dashboard **does not** include the local Computer Vision, OS hooks, or real-time focus enforcement features. It acts purely as a dashboard to interact with the FastAPI cloud backend.

## 2. Tech Stack
- **Framework**: React / Next.js / Vue (Shared with Tauri Desktop app).
- **Styling**: TailwindCSS or styled-components (aim for a dark, gamified, neon-accented aesthetic).
- **State Management**: Redux Toolkit, Zustand, or Vuex.
- **API Client**: Axios or standard Fetch for hitting the FastAPI endpoints.

## 3. Core Features & Views

### A. The Dashboard (Home)
- **Lifetime Stats**: Displays total lifetime points, highest focus streak, and current point balance.
- **Recent Activity**: A timeline of recent focus sessions, punishments endured, and rewards purchased.
- **The Shop**: A read-only view of the economy. Users can see what rewards (e.g., 30 mins of YouTube, 1 hour of gaming) cost, but purchasing them from the web doesn't activate them on the desktop immediately unless the desktop app is online and syncing.

### B. Social & Leaderboards
- **Global Leaderboard**: Top 100 users by total lifetime points.
- **Friends Leaderboard**: A localized leaderboard showing only accepted friends.
- **Friend Management**: Search for users by username, send friend requests, and accept/decline pending requests.

### C. Co-op Boss Fights (Raid Management)
- **Lobby Creation**: Users can create a new Co-op Raid session and generate an invite code.
- **Pre-game Lobby**: Users can join a lobby via invite code and see who is ready.
- **Launch**: Once launched, the web dashboard simply shows the raid as "Active". The actual real-time enforcement and point tracking must happen on the local Desktop or Mobile clients. The web dashboard will listen to the WebSocket stream just to visually update the raid's progress for spectators.

## 4. Separation of Concerns (Tauri vs. Web)
To maintain a single codebase, use environment variables or feature flags to detect the environment:

```javascript
// Example check
const isDesktop = window.__TAURI__ !== undefined;

if (isDesktop) {
  // Render the real-time CV focus UI and OS control panel
  return <FocusEnforcerUI />;
} else {
  // Render the cloud dashboard
  return <WebDashboardUI />;
}
```

The Web App communicates strictly with the `https://api.prodo.com` FastAPI backend via REST and WebSockets, whereas the Desktop App communicates primarily with its local Rust backend via Tauri IPC, only syncing with the cloud API periodically.
