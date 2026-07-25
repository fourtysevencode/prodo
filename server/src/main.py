"""
Prodo API Cloudflare Python Worker Entrypoint & FastAPI Router.

Main entry point for the Prodo API server. Serves as both a FastAPI application
(for local testing and container deployments) and a Pyodide-compatible Worker handler (`on_fetch`)
for Cloudflare Workers deployment.
"""

import json
import urllib.parse
from database import init_db
from compat import create_json_response, create_error_response
from routes.auth_routes import (
    handle_google_auth, handle_register, handle_login,
    handle_update_username, handle_tester_login,
    handle_request_device_code, handle_approve_device_code, handle_poll_device_code
)
from routes.user_routes import handle_get_me, handle_sync_user_data
from routes.friend_routes import handle_get_friends_list, handle_add_friend
from routes.leaderboard_routes import handle_get_global_leaderboard, handle_get_friends_leaderboard
from routes.coop_routes import handle_create_coop_room, handle_get_active_coop_rooms, handle_join_coop_room, handle_end_coop_room
from routes.ai_routes import handle_generate_punishment_task, handle_verify_punishment_task
from routes.telemetry_routes import handle_log_telemetry, handle_get_telemetry_logs
from routes.dev_routes import handle_dev_login, handle_get_dev_stats, handle_get_dev_telemetry

# Conditionally instantiate FastAPI app if available in environment
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from routes.auth_routes import router as auth_router
    from routes.user_routes import router as user_router
    from routes.friend_routes import router as friend_router
    from routes.leaderboard_routes import router as leaderboard_router
    from routes.coop_routes import router as coop_router
    from routes.ai_routes import router as ai_router
    from routes.telemetry_routes import router as telemetry_router
    from routes.dev_routes import router as dev_router

    app = FastAPI(title="Prodo API Backend", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def startup_event():
        init_db()

    @app.get("/")
    @app.get("/health")
    async def health_check():
        return {"status": "ok", "service": "prodo-api-fastapi", "version": "1.0.0"}

    app.include_router(auth_router)
    app.include_router(user_router)
    app.include_router(friend_router)
    app.include_router(leaderboard_router)
    app.include_router(coop_router)
    app.include_router(ai_router)
    app.include_router(telemetry_router)
    app.include_router(dev_router)
except ImportError:
    app = None


# ── Cloudflare Worker Python Pyodide Fetch Handler ───────────────────────────

async def on_fetch(request, env=None, ctx=None):
    """
    Cloudflare Worker Pyodide Entry Point (`on_fetch`).
    Provides zero-dependency routing for Cloudflare Worker Pyodide runtime.
    """
    init_db()

    url_str = str(getattr(request, "url", ""))
    method = str(getattr(request, "method", "GET")).upper()
    parsed_url = urllib.parse.urlparse(url_str)
    path = parsed_url.path

    # CORS Preflight OPTIONS
    if method == "OPTIONS":
        return create_json_response({"status": "ok"}, status_code=204)

    # Health check
    if path in ["/", "/health"]:
        return create_json_response({"status": "ok", "service": "prodo-api-worker-python"})

    # ── Authentication Endpoints ─────────────────────────────────────────────
    if path == "/auth/google" and method == "POST":
        return await handle_google_auth(request)
    if path == "/auth/register" and method == "POST":
        return await handle_register(request)
    if path == "/auth/login" and method == "POST":
        return await handle_login(request)
    if path == "/auth/username" and method == "POST":
        return await handle_update_username(request)
    if path == "/auth/tester" and method == "POST":
        return await handle_tester_login(request)
    if path == "/auth/device-code" and method == "POST":
        return await handle_request_device_code(request)
    if path == "/auth/device-approve" and method == "POST":
        return await handle_approve_device_code(request)
    if path == "/auth/device-poll" and method == "POST":
        return await handle_poll_device_code(request)

    # ── AI Whimsical Punishment Endpoints ────────────────────────────────────
    if path in ["/ai/generate-punishment", "/ai/task/generate"]:
        return await handle_generate_punishment_task("math")
    if path in ["/ai/verify-punishment", "/ai/task/verify"] and method == "POST":
        return await handle_verify_punishment_task(request)

    # ── Telemetry & Dev Endpoints ─────────────────────────────────────────────
    if path == "/telemetry/log" and method == "POST":
        return await handle_log_telemetry(request)
    if path == "/dev/login" and method == "POST":
        return await handle_dev_login(request)
    if path == "/dev/stats" and method == "GET":
        return await handle_get_dev_stats(request)
    if path == "/dev/telemetry" and method == "GET":
        return await handle_get_dev_telemetry(request)

    # ── User Profile & Sync Endpoints ─────────────────────────────────────────
    if path == "/users/me" and method == "GET":
        return await handle_get_me(request)
    if path == "/users/sync" and method == "POST":
        return await handle_sync_user_data(request)

    # ── Social & Friends Endpoints ────────────────────────────────────────────
    if path == "/friends/list" and method == "GET":
        return await handle_get_friends_list(request)
    if path == "/friends/add" and method == "POST":
        return await handle_add_friend(request)

    # ── Leaderboards ─────────────────────────────────────────────────────────
    if path == "/leaderboard/global":
        return await handle_get_global_leaderboard()
    if path == "/leaderboard/friends":
        return await handle_get_friends_leaderboard(request)

    # ── Co-Op Session Endpoints ──────────────────────────────────────────────
    if path == "/coop/create" and method == "POST":
        return await handle_create_coop_room(request)
    if path == "/coop/active" and method == "GET":
        return await handle_get_active_coop_rooms()
    if path == "/coop/join" and method == "POST":
        return await handle_join_coop_room(request)
    if path == "/coop/end" and method == "POST":
        return await handle_end_coop_room(request)

    # If FastAPI app is available, delegate request to FastAPI as fallback
    if app is not None:
        return app

    return create_error_response(f"Endpoint {path} not found", 404)
