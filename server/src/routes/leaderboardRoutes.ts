import { Env, LeaderboardEntry, UserRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { extractBearerToken } from "../utils/googleAuth";

/**
 * Handles GET /leaderboard/global
 */
export async function handleGlobalLeaderboard(_request: Request, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      "SELECT username, total_lifetime_points as points FROM users ORDER BY points DESC LIMIT 10"
    ).all();

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
 */
export async function handleFriendsLeaderboard(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT id FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const { results } = await env.DB.prepare(`
      SELECT username, total_lifetime_points as points FROM users WHERE id = ?
      UNION
      SELECT u.username, u.total_lifetime_points as points FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
      ORDER BY points DESC
    `)
      .bind(user.id, user.id)
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
