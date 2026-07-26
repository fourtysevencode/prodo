"""
Prodo API Cloudflare Python Worker Entrypoint & FastAPI Router.

Main entry point for the Prodo API server. Uses the Cloudflare Workers Python SDK
(WorkerEntrypoint class pattern) for deployment, and FastAPI for local testing.
"""

import json
import urllib.parse
import database
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

# ── Cloudflare Workers Python SDK Entry Point ─────────────────────────────────
try:
    from workers import WorkerEntrypoint, Response as WorkersResponse
    _HAS_WORKERS_SDK = True
except (ImportError, Exception):
    _HAS_WORKERS_SDK = False

    class WorkerEntrypoint:
        """Local stub — never instantiated during pytest."""
        pass

    class WorkersResponse:
        """Local stub for Workers Response."""
        def __init__(self, body="", status=200, headers=None):
            self.body = body
            self.status = status
            self.headers = headers or {}


class Default(WorkerEntrypoint):
    """
    Cloudflare Worker entry point class. The `fetch` method handles all incoming
    HTTP requests and routes them to the appropriate handler function.
    """

    async def fetch(self, request):
        """Route incoming HTTP requests to the correct handler."""
        # Attach Cloudflare environment to database layer for D1 access
        database.WORKER_ENV = getattr(self, "env", None)

        url_str = str(request.url)
        method = str(request.method).upper()
        parsed_url = urllib.parse.urlparse(url_str)
        path = parsed_url.path

        # CORS Preflight OPTIONS
        if method == "OPTIONS":
            return WorkersResponse("", status=204, headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
                "Access-Control-Allow-Headers": "*",
            })

        # Health check
        if path in ["/", "/health"]:
            return _json_response({"status": "ok", "service": "prodo-api-worker-python"})

        # ── Authentication Endpoints ─────────────────────────────────────────
        if path == "/auth/google" and method == "POST": return await _wrap(handle_google_auth, request)
        if path == "/auth/register" and method == "POST": return await _wrap(handle_register, request)
        if path == "/auth/login" and method == "POST": return await _wrap(handle_login, request)
        if path == "/auth/username" and method == "POST": return await _wrap(handle_update_username, request)
        if path == "/auth/tester" and method == "POST":return await _wrap(handle_tester_login, request)
        if path == "/auth/device-code" and method == "POST": return await _wrap(handle_request_device_code, request)
        if path == "/auth/device-approve" and method == "POST": return await _wrap(handle_approve_device_code, request)
        if path == "/auth/device-poll" and method == "POST": return await _wrap(handle_poll_device_code, request)

        # ── AI Punishment Endpoints ────────────────────────────────
        if path in ["/ai/generate-punishment", "/ai/task/generate"]:
            return await _wrap(handle_generate_punishment_task, "math")
        if path in ["/ai/verify-punishment", "/ai/task/verify"] and method == "POST":
            return await _wrap(handle_verify_punishment_task, request)

        # ── Telemetry & Dev Endpoints ────────────────────────────────────────
        if path == "/telemetry/log" and method == "POST":
            return await _wrap(handle_log_telemetry, request)
        if path == "/dev/login" and method == "POST":
            return await _wrap(handle_dev_login, request)
        if path == "/dev/stats" and method == "GET":
            return await _wrap(handle_get_dev_stats, request)
        if path == "/dev/telemetry" and method == "GET":
            return await _wrap(handle_get_dev_telemetry, request)

        # ── User Profile & Sync Endpoints ────────────────────────────────────
        if path == "/users/me" and method == "GET":
            return await _wrap(handle_get_me, request)
        if path == "/users/sync" and method == "POST":
            return await _wrap(handle_sync_user_data, request)

        # ── Social & Friends Endpoints ───────────────────────────────────────
        if path == "/friends/list" and method == "GET":
            return await _wrap(handle_get_friends_list, request)
        if path == "/friends/add" and method == "POST":
            return await _wrap(handle_add_friend, request)

        # ── Leaderboards ─────────────────────────────────────────────────────
        if path == "/leaderboard/global":
            return await _wrap(handle_get_global_leaderboard)
        if path == "/leaderboard/friends":
            return await _wrap(handle_get_friends_leaderboard, request)

        # ── Co-Op Session Endpoints ──────────────────────────────────────────
        if path == "/coop/create" and method == "POST":
            return await _wrap(handle_create_coop_room, request)
        if path == "/coop/active" and method == "GET":
            return await _wrap(handle_get_active_coop_rooms)
        if path == "/coop/join" and method == "POST":
            return await _wrap(handle_join_coop_room, request)
        if path == "/coop/end" and method == "POST":
            return await _wrap(handle_end_coop_room, request)

        return _json_response({"success": False, "error": f"Endpoint {path} not found"}, 404)


def _json_response(data, status=200):
    """Helper to create a Workers Response with JSON body and CORS headers."""
    return WorkersResponse(
        json.dumps(data),
        status=status,
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "*",
        },
    )


async def _wrap(handler, *args):
    """
    Call a route handler and convert its return value into a Workers Response.
    Route handlers return either a dict-like compat response or a FastAPI JSONResponse.
    This wrapper normalises both into a Workers SDK Response.
    """
    try:
        result = await handler(*args) if args else await handler()
    except Exception as e:
        import traceback
        err_msg = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        print(f"Error in handler {handler.__name__}: {err_msg}")
        return _json_response({"success": False, "error": "Internal Server Error", "details": str(e)}, 500)

    # If the handler already returned a Workers Response, pass through
    if isinstance(result, WorkersResponse):
        return result

    # If it returned a FastAPI JSONResponse (from compat layer), extract body/status
    if hasattr(result, "body") and hasattr(result, "status_code"):
        return WorkersResponse(
            result.body.decode() if isinstance(result.body, bytes) else str(result.body),
            status=result.status_code,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        )

    # If it returned a plain dict (fallback compat), serialise it
    if isinstance(result, dict):
        status = result.pop("status_code", 200) if "status_code" in result else 200
        content = result.get("content", result)
        return _json_response(content, status)

    # Last resort
    return _json_response({"data": str(result)})


# ── FastAPI app for local pytest testing ─────────────────────────────────────
# This block only runs when FastAPI is available (local dev / CI), never in Pyodide.

app = None
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
        database.init_db()

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
except Exception:
    pass
