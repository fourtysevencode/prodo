import { Env, UserRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { extractBearerToken } from "../utils/googleAuth";

/**
 * Handles GET /users/me
 * Retrieves current authenticated user profile.
 */
export async function handleGetMe(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("User profile not found or unauthorized", 401);
    }

    return createJsonResponse({
      username: user.username,
      email: user.email,
      total_lifetime_points: user.total_lifetime_points || 0,
      current_balance: user.current_balance || 0,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch user profile", 500);
  }
}

/**
 * Handles POST /users/sync
 * Calculates focus points with Co-Op room multipliers and updates database.
 */
export async function handleSync(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("User not found or unauthorized", 401);
    }

    const body: any = await request.json();
    const pointsEarned = Number(body.points_earned_since_last_sync || 0);
    const currentMultiplier = Number(body.current_multiplier || 1.0);
    const isCamOn = Boolean(body.is_cam_on);

    // Check if user is in active co-op session
    const coopResult = await env.DB.prepare(
      "SELECT COUNT(*) as activeCount FROM coop_sessions WHERE (host_user_id = ? OR friend_user_id = ?) AND is_active = 1"
    )
      .bind(user.id, user.id)
      .first<{ activeCount: number }>();

    const inCoop = coopResult ? Number(coopResult.activeCount) > 0 : false;
    const multiplierBoost = inCoop && isCamOn ? 5.0 : 1.0;
    const addedPoints = Math.floor(pointsEarned * multiplierBoost);

    const updatedXp = (user.xp || 0) + addedPoints;
    const updatedLifetimePoints = (user.total_lifetime_points || 0) + addedPoints;
    const updatedBalance = (user.current_balance || 0) + addedPoints;

    await env.DB.prepare(
      "UPDATE users SET xp = ?, total_lifetime_points = ?, current_balance = ?, current_multiplier = ? WHERE id = ?"
    )
      .bind(updatedXp, updatedLifetimePoints, updatedBalance, currentMultiplier, user.id)
      .run();

    return createJsonResponse({
      success: true,
      points_added: addedPoints,
      multiplier: currentMultiplier * multiplierBoost,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Sync failed", 500);
  }
}
