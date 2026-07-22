import { Env, LeaderboardEntry, UserRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { extractBearerToken } from "../utils/googleAuth";

/**
 * Handles GET /leaderboard/global
 * Filters out anonymous tester accounts.
 */
export async function handleGlobalLeaderboard(_request: Request, env: Env): Promise<Response> {
  try {
    const currentTime = Date.now() / 1000;
    const { results } = await env.DB.prepare(`
      SELECT username, total_lifetime_points as points FROM users 
      WHERE (is_tester IS NULL OR is_tester = 0) AND username NOT LIKE 'tester_%'
      ORDER BY points DESC LIMIT 10
    `).all();

    const leaderboard: LeaderboardEntry[] = results.map((row: any, index: number) => ({
      username: row.username,
      points: Number(row.points || 0),
      rank: index + 1,
    }));

    return createJsonResponse({ success: true, leaderboard });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch global leaderboard", 500);
  }
}

/**
 * Handles GET /leaderboard/friends
 * Includes active 30-minute tester accounts; removes expired ones automatically.
 */
export async function handleFriendsLeaderboard(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const currentTime = Date.now() / 1000;

    const { results } = await env.DB.prepare(`
      SELECT username, total_lifetime_points as points FROM users 
      WHERE id = ? AND (is_tester IS NULL OR is_tester = 0 OR tester_expires_at > ?)
      UNION
      SELECT u.username, u.total_lifetime_points as points FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND (u.is_tester IS NULL OR u.is_tester = 0 OR u.tester_expires_at > ?)
      ORDER BY points DESC
    `)
      .bind(user.id, currentTime, user.id, currentTime)
      .all();

    const leaderboard: LeaderboardEntry[] = results.map((row: any, index: number) => ({
      username: row.username,
      points: Number(row.points || 0),
      rank: index + 1,
    }));

    return createJsonResponse({ success: true, leaderboard });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch friends leaderboard", 500);
  }
}
