/**
 * Prodo API Service Layer
 * Connects the frontend to the FastAPI server (http://127.0.0.1:8000).
 * Supports Authorization headers via sessionStorage tokens.
 */

export function getApiBaseUrl(): string {
  const saved = localStorage.getItem("prodo_api_base_url");
  if (saved) return saved;
  
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== "undefined" && window.location) {
    const hn = window.location.hostname;
    if (hn && (hn === "prodo.live" || hn === "www.prodo.live" || hn === "prodo-live.pages.dev")) {
      return "https://cv.prodo.live";
    }
  }
  
  return "http://127.0.0.1:8000";
}

export function setApiBaseUrl(url: string) {
  // Ensure we strip trailing slash if present
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
  }
  localStorage.setItem("prodo_api_base_url", cleanUrl);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem("prodo_token");
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const base = getApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
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

export function apiGoogleLogin(credential: string) {
  return apiFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
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

// ── Friends & Co-Op ──────────────────────────────────────────────────────────

export function apiAddFriend(username: string) {
  return apiFetch<{ success: boolean; message: string }>("/friends/add", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function apiGetFriendsList() {
  return apiFetch<{ success: boolean; friends: { username: string; points: number }[] }>("/friends/list");
}

export function apiCreateCoopSession(friendUsername: string) {
  return apiFetch<{ success: boolean; session_id: string }>("/coop/create", {
    method: "POST",
    body: JSON.stringify({ friend_username: friendUsername }),
  });
}

export function apiJoinCoopSession(sessionId: string) {
  return apiFetch<{ success: boolean; message: string }>("/coop/join", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export function apiEndCoopSession(sessionId: string) {
  return apiFetch<{ success: boolean; message: string }>("/coop/end", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

// ── Leaderboards ─────────────────────────────────────────────────────────────

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

// ── AI Task Waiver ───────────────────────────────────────────────────────────

export interface AITaskResponse {
  success: boolean;
  task_id: string;
  prompt: string;
  type: "math" | "essay";
}

export function apiGenerateAITask(taskType: "math" | "essay") {
  return apiFetch<AITaskResponse>("/ai/generate-task", {
    method: "POST",
    body: JSON.stringify({ type: taskType }),
  });
}

export function apiVerifyAITask(taskId: string, answer: string) {
  return apiFetch<{ success: boolean; message: string }>("/ai/verify-task", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId, answer }),
  });
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

export function apiCheckFocus(
  frameBlob: Blob,
  sessionId = "default",
  includeDebug = false
): Promise<FocusCheckResult> {
  const form = new FormData();
  form.append("frame", frameBlob, "frame.jpg");
  form.append("session_id", sessionId);
  form.append("include_debug", String(includeDebug));
  return fetch(`${getApiBaseUrl()}/check-focus`, { method: "POST", body: form }).then(r => r.json());
}
