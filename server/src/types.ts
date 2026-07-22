/**
 * Type definitions for the Prodo Cloudflare Worker API.
 */

export interface Env {
  DB: D1Database;
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
