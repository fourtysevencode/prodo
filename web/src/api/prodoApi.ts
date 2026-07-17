/**
 * Prodo API Service Layer
 * Connects the web frontend to the local FastAPI server (http://127.0.0.1:8000).
 * The BASE_URL can be changed via the VITE_API_URL env variable for staging/prod.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  user: { email?: string; username?: string };
}

export function apiRegister(username: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function apiLogin(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  username: string;
  email: string;
  total_lifetime_points: number;
  current_balance: number;
}

export function apiGetMe() {
  return apiFetch<UserProfile>("/users/me");
}

export function apiSync(points_earned_since_last_sync: number, current_multiplier: number) {
  return apiFetch<{ success: boolean; points_added: number; multiplier: number }>("/users/sync", {
    method: "POST",
    body: JSON.stringify({ points_earned_since_last_sync, current_multiplier }),
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  username: string;
  points: number;
  rank?: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
}

export function apiGetGlobalLeaderboard() {
  return apiFetch<LeaderboardResponse>("/leaderboard/global");
}

export function apiGetFriendsLeaderboard() {
  return apiFetch<LeaderboardResponse>("/leaderboard/friends");
}

// ── CV Focus Check ────────────────────────────────────────────────────────────

export interface FocusCheckResult {
  session_id: string;
  status: "FOCUSED" | "DISTRACTED" | "UNCERTAIN";
  focus_score: number;
  rolling_focus_score: number;
  signals: {
    face_presence: number;
    head_pose: number;
    gaze: number;
    eyes_open: number;
  };
}

/**
 * Posts a JPEG/PNG blob to /check-focus and returns the model result.
 * Only call from desktop/mobile — the web client never captures camera frames.
 */
export function apiCheckFocus(
  frameBlob: Blob,
  sessionId = "default",
  includeDebug = false
): Promise<FocusCheckResult> {
  const form = new FormData();
  form.append("frame", frameBlob, "frame.jpg");
  form.append("session_id", sessionId);
  form.append("include_debug", String(includeDebug));
  return fetch(`${BASE_URL}/check-focus`, { method: "POST", body: form }).then(r => r.json());
}
