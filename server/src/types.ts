/**
 * Type definitions for the Prodo Cloudflare Worker API.
 */

export interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
}

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  xp: number;
  current_multiplier: number;
  total_lifetime_points: number;
  current_balance: number;
  auth_token: string | null;
  is_tester?: number;
  tester_expires_at?: number | null;
  needs_handle?: number;
  is_dev?: number;
  dev_token?: string | null;
}

export interface GoogleTokenPayload {
  email: string;
  name?: string;
  sub?: string;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  rank: number;
}

export interface CoopRoomRecord {
  session_id: string;
  host_username: string;
  started_at: number;
}

export interface DeviceAuthRecord {
  device_code: string;
  user_id: number | null;
  auth_token: string | null;
  status: "PENDING" | "APPROVED" | "EXPIRED";
  created_at: number;
}

export interface TelemetryLogRecord {
  id: number;
  event: string;
  session_id: string;
  details: string;
  created_at: number;
}

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
