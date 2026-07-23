/**
 * Prodo API Cloudflare Worker Entry Point
 * 
 * Modular HTTP router serving authentication, user profile sync, friends, leaderboards,
 * seamless device OAuth handoff, dev tooling, telemetry, and co-op focus sessions backed by Cloudflare D1.
 */

import { Env } from "./types";
import { getCorsHeaders, createJsonResponse, createErrorResponse } from "./utils/cors";
import { 
  handleGoogleAuth, 
  handleRegister, 
  handleLogin, 
  handleUpdateUsername, 
  handleTesterLogin, 
  handleDeviceCodeRequest, 
  handleDeviceCodeApprove, 
  handleDeviceCodePoll 
} from "./routes/authRoutes";
import { handleGetMe, handleSync } from "./routes/userRoutes";
import { handleGetFriendsList, handleAddFriend } from "./routes/friendRoutes";
import { handleGlobalLeaderboard, handleFriendsLeaderboard } from "./routes/leaderboardRoutes";
import { handleCreateCoop, handleGetActiveCoop, handleJoinCoop, handleEndCoop } from "./routes/coopRoutes";
import { handleTelemetryLog, handleGetDevTelemetry } from "./routes/telemetryRoutes";
import { handleDevLogin, handleDevStats } from "./routes/devRoutes";

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS OPTIONS Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders() });
    }

    // Health check endpoint
    if (path === "/" || path === "/health") {
      return createJsonResponse({ status: "ok", service: "prodo-api-worker" });
    }

    // ── Authentication Endpoints ─────────────────────────────────────────────
    if (path === "/auth/google" && method === "POST") return handleGoogleAuth(request, env);
    if (path === "/auth/register" && method === "POST") return handleRegister(request, env);
    if (path === "/auth/login" && method === "POST") return handleLogin(request, env);
    if (path === "/auth/username" && method === "POST") return handleUpdateUsername(request, env);
    if (path === "/auth/tester" && method === "POST") return handleTesterLogin(request, env);

    // ── Seamless Device OAuth Handoff (Tauri Web Auth) ────────────────────────
    if (path === "/auth/device-code" && method === "POST") return handleDeviceCodeRequest(request, env);
    if (path === "/auth/device-approve" && method === "POST") return handleDeviceCodeApprove(request, env);
    if (path === "/auth/device-poll" && method === "POST") return handleDeviceCodePoll(request, env);

    // ── Telemetry & Developer Tooling Endpoints (dev.prodo.live) ──────────────
    if (path === "/telemetry/log" && method === "POST") return handleTelemetryLog(request, env);
    if (path === "/dev/login" && method === "POST") return handleDevLogin(request, env);
    if (path === "/dev/stats" && method === "GET") return handleDevStats(request, env);
    if (path === "/dev/telemetry" && method === "GET") return handleGetDevTelemetry(request, env);

    // ── User Profile & Sync Endpoints ─────────────────────────────────────────
    if (path === "/users/me" && method === "GET") return handleGetMe(request, env);
    if (path === "/users/sync" && method === "POST") return handleSync(request, env);

    // ── Social & Friends Endpoints ────────────────────────────────────────────
    if (path === "/friends/list" && method === "GET") return handleGetFriendsList(request, env);
    if (path === "/friends/add" && method === "POST") return handleAddFriend(request, env);

    // ── Leaderboard Rankings Endpoints ────────────────────────────────────────
    if (path === "/leaderboard/global" && (method === "GET" || method === "POST")) {
      return handleGlobalLeaderboard(request, env);
    }
    if (path === "/leaderboard/friends" && (method === "GET" || method === "POST")) {
      return handleFriendsLeaderboard(request, env);
    }

    // ── Co-Op Session Endpoints ──────────────────────────────────────────────
    if (path === "/coop/create" && method === "POST") return handleCreateCoop(request, env);
    if (path === "/coop/active" && method === "GET") return handleGetActiveCoop(request, env);
    if (path === "/coop/join" && method === "POST") return handleJoinCoop(request, env);
    if (path === "/coop/end" && method === "POST") return handleEndCoop(request, env);

    // 404 Route Fallback
    return createErrorResponse(`Endpoint ${path} not found`, 404);
  },
};
