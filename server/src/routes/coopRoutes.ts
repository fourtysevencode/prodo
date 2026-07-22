import { Env, UserRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { extractBearerToken, generateSecureToken } from "../utils/googleAuth";

/**
 * Handles POST /coop/create
 */
export async function handleCreateCoop(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT id, username FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body: any = await request.json();
    let friendUserId: number | null = null;

    if (body.friend_username) {
      const targetUsername = String(body.friend_username).trim().toLowerCase();
      const friend = await env.DB.prepare("SELECT id FROM users WHERE lower(username) = ?")
        .bind(targetUsername)
        .first<UserRecord>();
      if (friend) {
        friendUserId = Number(friend.id);
      }
    }

    const sessionId = generateSecureToken("coop_");
    const currentTime = Date.now() / 1000;

    await env.DB.prepare(
      "INSERT INTO coop_sessions (session_id, host_user_id, friend_user_id, is_active, started_at) VALUES (?, ?, ?, 1, ?)"
    )
      .bind(sessionId, user.id, friendUserId, currentTime)
      .run();

    return createJsonResponse({ success: true, session_id: sessionId });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to create Co-Op room", 500);
  }
}

/**
 * Handles GET /coop/active
 */
export async function handleGetActiveCoop(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT id FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const { results } = await env.DB.prepare(`
      SELECT cs.session_id, u.username as host_username, cs.started_at FROM coop_sessions cs
      JOIN users u ON cs.host_user_id = u.id
      WHERE cs.is_active = 1 AND cs.host_user_id != ?
        AND (cs.friend_user_id IS NULL OR cs.friend_user_id = ?)
    `)
      .bind(user.id, user.id)
      .all();

    return createJsonResponse({ success: true, rooms: results });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch active Co-Op rooms", 500);
  }
}

/**
 * Handles POST /coop/join
 */
export async function handleJoinCoop(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT id FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body: any = await request.json();
    const sessionId = String(body.session_id || "").trim();

    const room = await env.DB.prepare("SELECT * FROM coop_sessions WHERE session_id = ? AND is_active = 1")
      .bind(sessionId)
      .first();

    if (!room) {
      return createErrorResponse("Active Co-Op session not found", 404);
    }

    if (!room.friend_user_id) {
      await env.DB.prepare("UPDATE coop_sessions SET friend_user_id = ? WHERE session_id = ?")
        .bind(user.id, sessionId)
        .run();
    }

    return createJsonResponse({ success: true, message: "Joined Co-Op focus room" });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to join Co-Op session", 500);
  }
}

/**
 * Handles POST /coop/end
 */
export async function handleEndCoop(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT id FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body: any = await request.json();
    const sessionId = String(body.session_id || "").trim();

    await env.DB.prepare("UPDATE coop_sessions SET is_active = 0 WHERE session_id = ? AND host_user_id = ?")
      .bind(sessionId, user.id)
      .run();

    return createJsonResponse({ success: true, message: "Co-Op session ended" });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to end Co-Op session", 500);
  }
}
