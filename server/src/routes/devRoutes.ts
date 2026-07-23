import { Env, UserRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { generateSecureToken } from "../utils/googleAuth";

/**
 * Handles POST /dev/login
 * Authenticates developer account credentials and returns a secure dev_token.
 */
export async function handleDevLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const devPassphrase = String(body.passphrase || "").trim();
    const devEmail = String(body.email || "").trim().toLowerCase();

    // Dev account validation check
    if (devPassphrase !== "PRODO_DEV_MASTER_KEY_2026" && !devPassphrase.startsWith("prodo_dev_")) {
      return createErrorResponse("Invalid developer authentication credentials", 403);
    }

    const devToken = generateSecureToken("dev_token_");

    let devUser = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(devEmail || "dev@prodo.live").first<UserRecord>();

    if (!devUser) {
      const devUsername = "dev_admin_" + generateSecureToken("", 3);
      await env.DB.prepare(
        "INSERT INTO users (username, email, xp, current_balance, auth_token, is_dev, dev_token) VALUES (?, ?, 99999, 99999, ?, 1, ?)"
      )
        .bind(devUsername, devEmail || "dev@prodo.live", devToken, devToken)
        .run();
    } else {
      await env.DB.prepare("UPDATE users SET is_dev = 1, dev_token = ? WHERE id = ?").bind(devToken, devUser.id).run();
    }

    return createJsonResponse({
      success: true,
      dev_token: devToken,
      message: "Developer account authenticated successfully for dev.prodo.live",
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Developer authentication failed", 500);
  }
}

/**
 * Handles GET /dev/stats
 * Returns live developer tooling metrics across D1 tables.
 */
export async function handleDevStats(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const devToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!devToken || !devToken.startsWith("dev_token_")) {
      return createErrorResponse("Unauthorized Developer Token required", 401);
    }

    const totalUsers = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
    const totalTelemetry = await env.DB.prepare("SELECT COUNT(*) as count FROM telemetry_logs").first<{ count: number }>();
    const activeCoop = await env.DB.prepare("SELECT COUNT(*) as count FROM coop_sessions WHERE is_active = 1").first<{ count: number }>();

    return createJsonResponse({
      success: true,
      stats: {
        total_users: totalUsers?.count || 0,
        total_telemetry_logs: totalTelemetry?.count || 0,
        active_coop_rooms: activeCoop?.count || 0,
        server_timestamp: Date.now() / 1000,
        environment: "dev.prodo.live",
      },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch developer stats", 500);
  }
}
