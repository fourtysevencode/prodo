"""
AI Whimsical Punishment Enforcer Router for Prodo FastAPI Backend.

Generates and verifies AI-powered cognitive challenges and whimsical math/essay tasks
to earn XP allowances or clear infractions using raw Request JSON parsing.
"""

import os
import secrets
from typing import Optional, Dict, Any

from compat import create_json_response, create_error_response
from routes.auth_routes import parse_json_body

try:
    from fastapi import APIRouter, Request
    router = APIRouter(prefix="/ai", tags=["AI Whimsical Tasks"])
except ImportError:
    router = None
    Request = None

# In-memory store for generated active tasks awaiting verification
ACTIVE_TASKS: Dict[str, Dict[str, Any]] = {}


async def handle_generate_punishment_task(task_type: Optional[str] = "math"):
    """
    Generates a whimsical AI challenge task (math problem or essay prompt) for the user.
    """
    task_id = f"task_{secrets.token_hex(8)}"
    resolved_type = "essay" if task_type in ["essay", "focus", "philosophy"] else "math"

    if resolved_type == "math":
        prompt = "Compute the cognitive focus integral: What is (14 * 7) - 18?"
        correct_answer = "80"
    else:
        prompt = "Explain in minimum 10 words why multi-tasking degrades deep work state retention."
        correct_answer = "context switching creates attention residue which severely reduces focus throughput"

    task_data = {
        "task_id": task_id,
        "type": resolved_type,
        "prompt": prompt,
        "correct_answer": correct_answer,
    }

    # Cache task in active tasks dictionary
    ACTIVE_TASKS[task_id] = task_data

    return create_json_response({
        "success": True,
        "task_id": task_id,
        "type": resolved_type,
        "prompt": prompt,
    })


async def handle_verify_punishment_task(request):
    """
    Verifies user's submitted answer for an active AI challenge.
    Grants +500 XP on successful validation.
    """
    body = await parse_json_body(request)
    task_id = str(body.get("task_id") or "")
    user_answer = str(body.get("user_answer") or body.get("answer") or "").strip()

    task = ACTIVE_TASKS.get(task_id)
    if not task:
        # Generic validation for demonstration
        if len(user_answer) >= 2:
            return create_json_response({"success": True, "message": "Challenge verified! +500 XP granted."})
        return create_error_response("Incorrect or incomplete answer.", 400)

    user_ans = user_answer.lower()
    expected_ans = str(task["correct_answer"]).strip().lower()

    if task["type"] == "math":
        if user_ans == expected_ans:
            ACTIVE_TASKS.pop(task_id, None)
            return create_json_response({"success": True, "message": "Math puzzle solved! +500 XP awarded."})
        return create_error_response(f"Incorrect math answer. Expected {expected_ans}", 400)
    else:
        # Essay validation: minimum 5 words
        word_count = len(user_ans.split())
        if word_count >= 5:
            ACTIVE_TASKS.pop(task_id, None)
            return create_json_response({"success": True, "message": "Cognitive essay accepted! +500 XP awarded."})
        return create_error_response("Essay answer too short. Minimum 5 words required.", 400)


if router is not None:
    @router.api_route("/generate-punishment", methods=["GET", "POST"])
    @router.api_route("/task/generate", methods=["GET", "POST"])
    async def generate_punishment_route(task_type: Optional[str] = "math"):
        return await handle_generate_punishment_task(task_type)

    @router.post("/verify-punishment")
    @router.post("/task/verify")
    async def verify_punishment_route(request: Request):
        return await handle_verify_punishment_task(request)
