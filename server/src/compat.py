"""
Prodo Backend Compatibility Layer.

Provides unified response and request handling for both FastAPI (local testing & containers)
and Cloudflare Workers Pyodide Python environment (zero external dependency deployment).
"""

import json
from typing import Any, Dict, Optional

# Attempt to import FastAPI/Starlette components if available in environment
try:
    from fastapi import APIRouter, Request, Header
    from fastapi.responses import JSONResponse as FastAPIJSONResponse
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    APIRouter = None
    Request = Any
    Header = None
    FastAPIJSONResponse = None


def create_json_response(content: Dict[str, Any], status_code: int = 200) -> Any:
    """
    Creates a JSON HTTP response that works seamlessly in FastAPI TestClient
    as well as Cloudflare Workers Pyodide runtime.
    """
    if HAS_FASTAPI and FastAPIJSONResponse is not None:
        return FastAPIJSONResponse(status_code=status_code, content=content)

    # Cloudflare Pyodide JS Response fallback
    try:
        from js import Response, Headers
        headers = Headers.new()
        headers.set("Content-Type", "application/json")
        headers.set("Access-Control-Allow-Origin", "*")
        headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        headers.set("Access-Control-Allow-Headers", "*")
        return Response.new(json.dumps(content), status=status_code, headers=headers)
    except Exception:
        # Generic dictionary fallback
        return {"status_code": status_code, "content": content}


def create_error_response(message: str, status_code: int = 400) -> Any:
    """Helper to generate standardized error JSON response."""
    return create_json_response({"success": False, "error": message}, status_code=status_code)
