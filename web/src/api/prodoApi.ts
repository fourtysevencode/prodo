/**
 * Prodo API Service Layer
 * Connects the frontend to Cloudflare Worker API & Modal CV Server.
 * Supports Authorization headers via localStorage tokens.
 */

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    const hn = window.location.hostname;
    if (hn && (hn === "prodo.live" || hn === "www.prodo.live" || hn === "dev.prodo.live" || hn === "prodo-live.pages.dev" || hn === "website-dev.prodo-live.pages.dev")) {
      return "https://api.prodo.live";
    }
  }

  const saved = localStorage.getItem("prodo_api_base_url");
  if (saved) return saved;

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return "https://api.prodo.live";
}

export function getCvBaseUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    const hn = window.location.hostname;
    if (hn && (hn === "prodo.live" || hn === "www.prodo.live" || hn === "dev.prodo.live" || hn === "prodo-live.pages.dev" || hn === "website-dev.prodo-live.pages.dev")) {
      return "https://kazenoko-main--prodo-cv-fastapi-app.modal.run";
    }
  }

  const saved = localStorage.getItem("prodo_cv_base_url");
  if (saved) return saved;

  if (import.meta.env.VITE_CV_URL) {
    return import.meta.env.VITE_CV_URL;
  }

  return "https://kazenoko-main--prodo-cv-fastapi-app.modal.run";
}

export function setApiBaseUrl(url: string) {
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
  }
  localStorage.setItem("prodo_api_base_url", cleanUrl);
}

async function apiFetch<T>(path: string, init?: RequestInit, customToken?: string): Promise<T> {
  const token = customToken || localStorage.getItem("prodo_token");
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
  needs_handle?: boolean;
  is_tester?: boolean;
  tester_expires_at?: number;
  message?: string;
  user: { email?: string; username?: string };
}

export function apiRegister(username: string, email: string, password?: string) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function apiLogin(email: string, password?: string) {
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

export function apiTesterLogin() {
  return apiFetch<AuthResponse>("/auth/tester", {
    method: "POST",
  });
}

export function apiUpdateUsername(username: string) {
  return apiFetch<{ success: boolean; username: string; message?: string }>("/auth/username", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

// ── Device Code OAuth Handoff (Tauri Web Auth) ────────────────────────────────

export function apiDeviceCodeRequest() {
  return apiFetch<{ success: boolean; device_code: string; user_code_url: string }>("/auth/device-code", {
    method: "POST",
  });
}

export function apiDeviceCodeApprove(device_code: string) {
  return apiFetch<{ success: boolean; message: string }>("/auth/device-approve", {
    method: "POST",
    body: JSON.stringify({ device_code }),
  });
}

export function apiDeviceCodePoll(device_code: string) {
  return apiFetch<{ status: "PENDING" | "APPROVED"; token?: string }>("/auth/device-poll", {
    method: "POST",
    body: JSON.stringify({ device_code }),
  });
}

// ── Telemetry & Dev Tooling ──────────────────────────────────────────────────

export function apiSendTelemetry(event: string, details?: any) {
  return apiFetch<{ success: boolean; message: string }>("/telemetry/log", {
    method: "POST",
    body: JSON.stringify({
      event,
      details,
      session_id: localStorage.getItem("prodo_token") || "anonymous",
    }),
  });
}

export function apiDevLogin(passphrase: string, email?: string) {
  return apiFetch<{ success: boolean; dev_token: string; message?: string }>("/dev/login", {
    method: "POST",
    body: JSON.stringify({ passphrase, email }),
  });
}

export function apiGetDevStats(devToken: string) {
  return apiFetch<{ success: boolean; stats: any }>("/dev/stats", { method: "GET" }, devToken);
}

export function apiGetDevTelemetry(devToken: string) {
  return apiFetch<{ success: boolean; logs: any[] }>("/dev/telemetry", { method: "GET" }, devToken);
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

export function apiSync(points_earned_since_last_sync: number, current_multiplier: number, is_cam_on?: boolean) {
  return apiFetch<{ success: boolean; points_added: number; multiplier: number }>("/users/sync", {
    method: "POST",
    body: JSON.stringify({ points_earned_since_last_sync, current_multiplier, is_cam_on }),
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
    body: JSON.stringify({ friend_username: friendUsername || null }),
  });
}

export function apiGetActiveCoopRooms() {
  return apiFetch<{ success: boolean; rooms: { session_id: string; host_username: string; started_at: number }[] }>("/coop/active");
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

// ── AI Whimsical Punishment & Waiver Tasks ─────────────────────────────────

export interface AIPunishmentTask {
  task_id: string;
  task_type: "MULTIPLE_CHOICE" | "TYPING_PLEDGE" | "RIDDLE";
  title: string;
  description: string;
  prompt: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  provider_used?: string;
}

export interface AITaskResponse {
  task_id: string;
  question: string;
  prompt: string;
  type?: string;
  options?: string[];
  success?: boolean;
}

export function apiGenerateAIPunishment() {
  return apiFetch<{ success: boolean; task: AIPunishmentTask }>("/ai/generate-punishment", {
    method: "POST",
  });
}

export function apiVerifyAIPunishment(user_answer: string, correct_answer: string) {
  return apiFetch<{ success: boolean; reward_xp?: number; message: string }>("/ai/verify-punishment", {
    method: "POST",
    body: JSON.stringify({ user_answer, correct_answer }),
  });
}

export function apiGenerateAITask(_type?: string) {
  return apiGenerateAIPunishment().then(res => ({
    task_id: res.task.task_id,
    question: res.task.title,
    prompt: res.task.prompt,
    type: res.task.task_type === "RIDDLE" ? "math" : "essay",
    options: res.task.options,
    success: true,
  }));
}

export function apiVerifyAITask(_task_id: string, answer: string, correct_answer?: string) {
  return apiVerifyAIPunishment(answer, correct_answer || answer);
}

// ── Leaderboards ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  username: string;
  points: number;
  rank: number;
}

export function apiGetGlobalLeaderboard() {
  return apiFetch<{ success: boolean; leaderboard: LeaderboardEntry[] }>("/leaderboard/global");
}

export function apiGetFriendsLeaderboard() {
  return apiFetch<{ success: boolean; leaderboard: LeaderboardEntry[] }>("/leaderboard/friends");
}
