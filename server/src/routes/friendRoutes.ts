import { Env, UserRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { extractBearerToken } from "../utils/googleAuth";

/**
 * Handles GET /friends/list
 */
export async function handleGetFriendsList(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT id FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const { results } = await env.DB.prepare(`
      SELECT u.username, u.total_lifetime_points as points 
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
    `)
      .bind(user.id)
      .all();

    return createJsonResponse({ success: true, friends: results });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch friends list", 500);
  }
}

/**
 * Handles POST /friends/add
 */
export async function handleAddFriend(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT id FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body: any = await request.json();
    const targetUsername = String(body.username || "").trim().toLowerCase();
    
    if (!targetUsername) {
      return createErrorResponse("Friend username is required", 400);
    }

    const friendUser = await env.DB.prepare("SELECT id FROM users WHERE lower(username) = ?")
      .bind(targetUsername)
      .first<UserRecord>();

    if (!friendUser) {
      return createErrorResponse("Username not found", 404);
    }

    if (friendUser.id === user.id) {
      return createErrorResponse("You cannot add yourself", 400);
    }

    // Insert bi-directional friend relationship
    await env.DB.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)")
      .bind(user.id, friendUser.id)
      .run();
    await env.DB.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)")
      .bind(friendUser.id, user.id)
      .run();

    return createJsonResponse({ success: true, message: "Friend added successfully" });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to add friend", 500);
  }
}
