import { Env, UserRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { decodeGoogleToken } from "../utils/googleAuth";

/**
 * Handles POST /auth/google
 * Verifies Google credential JWT, provisions new user if absent, and returns session auth token.
 */
export async function handleGoogleAuth(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const payload = decodeGoogleToken(body.credential || "");

    if (!payload || !payload.email) {
      return createErrorResponse("Invalid Google credential", 400);
    }

    const userEmail = payload.email.toLowerCase();
    const googleId = payload.sub || "";

    let user = await env.DB.prepare("SELECT * FROM users WHERE email = ? OR google_id = ?")
      .bind(userEmail, googleId)
      .first<UserRecord>();

    let authToken = "";

    if (!user) {
      const generatedUsername = (payload.name || userEmail.split("@")[0])
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase();
      authToken = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);

      await env.DB.prepare(
        "INSERT INTO users (username, email, google_id, xp, current_balance, auth_token) VALUES (?, ?, ?, 100, 100, ?)"
      )
        .bind(generatedUsername, userEmail, googleId, authToken)
        .run();

      user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(userEmail).first<UserRecord>();
    } else {
      authToken = user.auth_token || "";
      if (!authToken) {
        authToken = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        await env.DB.prepare("UPDATE users SET auth_token = ? WHERE id = ?").bind(authToken, user.id).run();
      }
      if (!user.google_id && googleId) {
        await env.DB.prepare("UPDATE users SET google_id = ? WHERE id = ?").bind(googleId, user.id).run();
      }
    }

    return createJsonResponse({
      success: true,
      token: authToken,
      user: { username: user?.username || "operator", email: userEmail },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Google authentication failed", 500);
  }
}

/**
 * Handles POST /auth/register
 */
export async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const userEmail = (body.email || "").toLowerCase().trim();
    const userName = (body.username || "").toLowerCase().trim();

    if (!userEmail || !userName) {
      return createErrorResponse("Email and username are required", 400);
    }

    const existingUser = await env.DB.prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .bind(userEmail, userName)
      .first();

    if (existingUser) {
      return createErrorResponse("Username or email already exists", 400);
    }

    const authToken = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    await env.DB.prepare(
      "INSERT INTO users (username, email, xp, current_balance, auth_token) VALUES (?, ?, 100, 100, ?)"
    )
      .bind(userName, userEmail, authToken)
      .run();

    return createJsonResponse({
      success: true,
      token: authToken,
      user: { username: userName, email: userEmail },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Registration failed", 500);
  }
}

/**
 * Handles POST /auth/login
 */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const userEmail = (body.email || "").toLowerCase().trim();

    if (!userEmail) {
      return createErrorResponse("Email is required", 400);
    }

    let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(userEmail).first<UserRecord>();
    let authToken = "";

    if (!user) {
      const generatedUsername = userEmail.split("@")[0] || "operator";
      authToken = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      await env.DB.prepare(
        "INSERT INTO users (username, email, xp, current_balance, auth_token) VALUES (?, ?, 100, 100, ?)"
      )
        .bind(generatedUsername, userEmail, authToken)
        .run();

      user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(userEmail).first<UserRecord>();
    } else {
      authToken = user.auth_token || "";
      if (!authToken) {
        authToken = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        await env.DB.prepare("UPDATE users SET auth_token = ? WHERE id = ?").bind(authToken, user.id).run();
      }
    }

    return createJsonResponse({
      success: true,
      token: authToken,
      user: { username: user?.username || "operator", email: userEmail },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Login failed", 500);
  }
}
