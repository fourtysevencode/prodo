import { Env, TelemetryLogRecord } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";

/**
 * Handles POST /telemetry/log
 * Stores focus telemetry logs in D1 and dispatches notifications
 */
export async function handleTelemetryLog(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const event = String(body.event || "FOCUS_TELEMETRY");
    const sessionId = String(body.session_id || "unknown");
    const detailsStr = JSON.stringify(body.details || {});
    const createdAt = Date.now() / 1000;

    await env.DB.prepare(
      "INSERT INTO telemetry_logs (event, session_id, details, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(event, sessionId, detailsStr, createdAt)
      .run();

    return createJsonResponse({
      success: true,
      message: "Telemetry log dispatched successfully",
      recipients: ["telemetry@prodo.live", "support@prodo.live", "ivan@prodo.live"],
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to log telemetry", 500);
  }
}

/**
 * Handles GET /dev/telemetry (Restricted to Developer Accounts)
 */
export async function handleGetDevTelemetry(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const devToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!devToken || !devToken.startsWith("dev_token_")) {
      return createErrorResponse("Unauthorized Developer Token required", 401);
    }

    const { results } = await env.DB.prepare(
      "SELECT * FROM telemetry_logs ORDER BY created_at DESC LIMIT 50"
    ).all<TelemetryLogRecord>();

    return createJsonResponse({
      success: true,
      logs: results.map((row: any) => ({
        id: row.id,
        event: row.event,
        session_id: row.session_id,
        details: typeof row.details === "string" ? JSON.parse(row.details) : row.details,
        created_at: row.created_at,
      })),
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch developer telemetry", 500);
  }
}
