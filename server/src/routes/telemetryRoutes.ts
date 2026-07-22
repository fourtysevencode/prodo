import { Env } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";

/**
 * Handles POST /telemetry/log
 * Receives focus telemetry logs and logs them for telemetry@prodo.live, support@prodo.live, and ivan@prodo.live
 */
export async function handleTelemetryLog(request: Request, _env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const payload = {
      timestamp: new Date().toISOString(),
      recipients: ["telemetry@prodo.live", "support@prodo.live", "ivan@prodo.live"],
      event: body.event || "FOCUS_TELEMETRY",
      details: body.details || {},
      session_id: body.session_id || "unknown",
    };

    console.log("[TELEMETRY DISPATCH]", JSON.stringify(payload));

    return createJsonResponse({
      success: true,
      message: "Telemetry log dispatched successfully",
      recipients: payload.recipients,
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to log telemetry", 500);
  }
}
