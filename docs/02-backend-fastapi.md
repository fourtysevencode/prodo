# Backend Documentation (FastAPI)

## 1. Overview
The Prodo backend is the central source of truth for the social and sync layers. Built with **FastAPI** (Python), it is designed to be lightweight and extremely fast, acting as a stateless API to aggregate scores, manage friend connections, and orchestrate Co-op Boss Fights (multiplayer raids).

**Crucial Privacy Note:** The backend **NEVER** processes, receives, or stores any video data, images, or direct webcam streams. The local clients handle all Computer Vision. The backend only receives metadata (points, multipliers, session statuses).

## 2. Tech Stack
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL (Relational data for users, friendships, and global stats)
- **Cache / Real-time PubSub**: Redis (Critical for websockets, Co-op Raids, and fast leaderboard reads)
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Dockerized, intended for a serverless or auto-scaling container environment (e.g., AWS App Runner, Cloud Run, or simple VPS).

## 3. Database Schema (PostgreSQL)

### `users`
- `id` (UUID, Primary Key)
- `username` (String, Unique)
- `email` (String, Unique)
- `password_hash` (String)
- `total_lifetime_points` (Integer)
- `current_balance` (Integer) - *The spendable economy currency*
- `created_at` (Timestamp)

### `friendships`
- `id` (UUID, PK)
- `user_id_1` (UUID, FK -> users)
- `user_id_2` (UUID, FK -> users)
- `status` (Enum: PENDING, ACCEPTED, BLOCKED)

### `coop_raids` (History of boss fights)
- `id` (UUID, PK)
- `start_time` (Timestamp)
- `end_time` (Timestamp, Nullable)
- `total_points_earned` (Integer)
- `status` (Enum: ACTIVE, COMPLETED, FAILED)

## 4. API Endpoints

### Authentication
- `POST /auth/register`: Create a new user account.
- `POST /auth/login`: Authenticate and receive a JWT.

### User & Economy State
- `GET /users/me`: Fetch current profile, points, and balance.
- `POST /users/sync`: The primary polling endpoint used by desktop/mobile clients.
  - **Payload**: `{"points_earned_since_last_sync": 150, "current_multiplier": 2.5}`
  - **Action**: Verifies the payload and adds to the user's `current_balance` and `total_lifetime_points`.

### Leaderboards
- `GET /leaderboard/global`: Fetches top 100 users by `total_lifetime_points`.
- `GET /leaderboard/friends`: Fetches leaderboard restricted to accepted friends.

### Co-op Boss Fights (Multiplayer Raids)
- `POST /raid/create`: Initialize a new Co-op Raid session. Returns a unique invite code.
- `POST /raid/join/{invite_code}`: Join an existing pre-game lobby.
- `WS /ws/raid/{raid_id}`: **The core realtime loop.**

## 5. WebSockets & Co-op Syncing
The Co-op "Boss Fights" require real-time synchronization. If one party member looks away and breaks focus, the entire team takes a penalty.

**Implementation with Redis PubSub:**
1. When a user connects to `/ws/raid/{raid_id}`, the FastAPI server subscribes them to a Redis channel `raid_{raid_id}`.
2. Every 5 seconds, clients emit a `status_ping` (e.g., `{"status": "FOCUSED", "multiplier": 3}`).
3. If any client sends a `status_break` (user got distracted), the FastAPI server broadcasts a penalty event to the Redis channel.
4. All connected clients receive the penalty broadcast and the local clients execute the punishment (e.g., locking the screen or applying a negative multiplier).
