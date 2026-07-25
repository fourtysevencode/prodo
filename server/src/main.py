"""
Prodo API FastAPI Backend Application.

Main entry point for the FastAPI server. Mounts all modular routers, configures CORS middleware,
initializes the SQLite database, and handles global application lifecycle events.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import init_db
from .routes.auth_routes import router as auth_router
from .routes.user_routes import router as user_router
from .routes.friend_routes import router as friend_router
from .routes.leaderboard_routes import router as leaderboard_router
from .routes.coop_routes import router as coop_router
from .routes.ai_routes import router as ai_router
from .routes.telemetry_routes import router as telemetry_router
from .routes.dev_routes import router as dev_router

# Initialize the core FastAPI Application instance
app = FastAPI(
    title="Prodo API Backend",
    description="FastAPI Backend for Prodo gamified focus platform.",
    version="1.0.0",
)

# Configure Cross-Origin Resource Sharing (CORS) middleware to allow web & desktop clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initializes SQLite database schemas on application startup."""
    init_db()


@app.get("/")
@app.get("/health")
async def health_check():
    """Health check endpoint confirming API service status."""
    return {"status": "ok", "service": "prodo-api-fastapi", "version": "1.0.0"}


# Mount all modular domain routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(friend_router)
app.include_router(leaderboard_router)
app.include_router(coop_router)
app.include_router(ai_router)
app.include_router(telemetry_router)
app.include_router(dev_router)


# ── Cloudflare Worker Python Pyodide Entrypoint Bridge ───────────────────────

async def on_fetch(request, env=None):
    """
    Cloudflare Worker Pyodide Python Worker Entrypoint (`on_fetch`).
    Proxies Cloudflare Workers fetch events through the FastAPI ASGI application.
    """
    # Initialize DB schema if env is provided
    init_db()
    # Execute ASGI request pipeline
    return app
