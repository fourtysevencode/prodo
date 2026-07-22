import { Env, UserRecord, DeviceAuthRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { decodeGoogleToken, extractBearerToken } from "../utils/googleAuth";

/**
 * Handles POST /auth/google
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
    let needsHandle = false;

    if (!user) {
      const generatedUsername = (payload.name || userEmail.split("@")[0])
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase();
      authToken = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      needsHandle = true;

      await env.DB.prepare(
        "INSERT INTO users (username, email, google_id, xp, current_balance, auth_token, needs_handle) VALUES (?, ?, ?, 100, 100, ?, 1)"
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
      needsHandle = Boolean(user.needs_handle);
    }

    return createJsonResponse({
      success: true,
      token: authToken,
      needs_handle: needsHandle,
      user: { username: user?.username || "operator", email: userEmail },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Google authentication failed", 500);
  }
}

/**
 * Handles POST /auth/username (Update user handle)
 */
export async function handleUpdateUsername(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("User not found", 401);
    }

    const body: any = await request.json();
    const newUsername = String(body.username || "").trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, "");

    if (!newUsername || newUsername.length < 3) {
      return createErrorResponse("Username must be at least 3 alphanumeric characters", 400);
    }

    const existing = await env.DB.prepare("SELECT id FROM users WHERE lower(username) = ? AND id != ?")
      .bind(newUsername, user.id)
      .first();

    if (existing) {
      return createErrorResponse("Username is already taken", 400);
    }

    await env.DB.prepare("UPDATE users SET username = ?, needs_handle = 0 WHERE id = ?")
      .bind(newUsername, user.id)
      .run();

    return createJsonResponse({
      success: true,
      username: newUsername,
      message: "Username handle updated successfully",
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to update username", 500);
  }
}

/**
 * Handles POST /auth/tester (Anonymous 30-minute tester login)
 */
export async function handleTesterLogin(_request: Request, env: Env): Promise<Response> {
  try {
    const randomHash = Math.random().toString(36).substring(2, 8);
    const testerUsername = `tester_${randomHash}`;
    const testerEmail = `tester_${randomHash}@prodo.live`;
    const authToken = "tester_token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = (Date.now() / 1000) + (30 * 60); // 30 minutes TTL

    await env.DB.prepare(
      "INSERT INTO users (username, email, xp, current_balance, auth_token, is_tester, tester_expires_at) VALUES (?, ?, 500, 500, ?, 1, ?)"
    )
      .bind(testerUsername, testerEmail, authToken, expiresAt)
      .run();

    return createJsonResponse({
      success: true,
      token: authToken,
      is_tester: true,
      tester_expires_at: expiresAt,
      user: { username: testerUsername, email: testerEmail },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Tester login failed", 500);
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

// ── Seamless Tauri Web-to-Desktop OAuth Device Auth Flow ─────────────────────

export async function handleDeviceCodeRequest(_request: Request, env: Env): Promise<Response> {
  try {
    const deviceCode = "devcode_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const createdAt = Date.now() / 1000;

    await env.DB.prepare(
      "INSERT INTO device_auths (device_code, status, created_at) VALUES (?, 'PENDING', ?)"
    )
      .bind(deviceCode, createdAt)
      .run();

    return createJsonResponse({
      success: true,
      device_code: deviceCode,
      user_code_url: `https://prodo.live/#/authorize-desktop?code=${deviceCode}`,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to create device authorization code", 500);
  }
}

export async function handleDeviceCodeApprove(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractBearerToken(request);
    const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first<UserRecord>();

    if (!user) {
      return createErrorResponse("Authentication required to approve device access", 401);
    }

    const body: any = await request.json();
    const deviceCode = String(body.device_code || "").trim();

    const deviceRecord = await env.DB.prepare("SELECT * FROM device_auths WHERE device_code = ? AND status = 'PENDING'")
      .bind(deviceCode)
      .first<DeviceAuthRecord>();

    if (!deviceRecord) {
      return createErrorResponse("Invalid or expired device code", 404);
    }

    await env.DB.prepare(
      "UPDATE device_auths SET user_id = ?, auth_token = ?, status = 'APPROVED' WHERE device_code = ?"
    )
      .bind(user.id, user.auth_token, deviceCode)
      .run();

    return createJsonResponse({
      success: true,
      message: "Prodo Desktop app authorized successfully",
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Device authorization approval failed", 500);
  }
}

export async function handleDeviceCodePoll(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const deviceCode = String(body.device_code || "").trim();

    const deviceRecord = await env.DB.prepare("SELECT * FROM device_auths WHERE device_code = ?")
      .bind(deviceCode)
      .first<DeviceAuthRecord>();

    if (!deviceRecord) {
      return createErrorResponse("Device code not found", 404);
    }

    if (deviceRecord.status === "APPROVED" && deviceRecord.auth_token) {
      return createJsonResponse({
        status: "APPROVED",
        token: deviceRecord.auth_token,
      });
    }

    return createJsonResponse({
      status: "PENDING",
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Polling device code failed", 500);
  }
}
