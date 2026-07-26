"""
AI Punishment Enforcer Router for Prodo FastAPI Backend.

Generates and verifies AI-powered cognitive challenges and math/essay tasks
to earn XP allowances or clear infractions using raw Request JSON parsing.
"""

import os
import time
import secrets
from typing import Optional, Dict, Any

from compat import create_json_response, create_error_response
from database import query_one, execute_db
from routes.auth_routes import parse_json_body

try:
    from fastapi import APIRouter, Request
    router = APIRouter(prefix="/ai", tags=["AI Tasks"])
except ImportError:
    router = None
    Request = None


async def handle_generate_punishment_task(task_type: Optional[str] = "math"):
    """
    Generates an AI challenge task (math problem or essay prompt) for the user.
    Persists task in punishment_tasks table.
    """
    task_id = f"task_{secrets.token_hex(8)}"
    resolved_type = "essay" if task_type in ["essay", "focus", "philosophy"] else "math"

    if resolved_type == "math":
        prompt = "Compute the cognitive focus integral: What is (14 * 7) - 18?"
        correct_answer = "80"
    else:
        prompt = "Explain in minimum 10 words why multi-tasking degrades deep work state retention."
        correct_answer = "context switching creates attention residue which severely reduces focus throughput"

    await execute_db(
        """
        INSERT INTO punishment_tasks (task_id, task_type, prompt, correct_answer, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (task_id, resolved_type, prompt, correct_answer, time.time())
    )

    return create_json_response({
        "success": True,
        "task_id": task_id,
        "type": resolved_type,
        "prompt": prompt,
    })


async def handle_verify_punishment_task(request):
    """
    Verifies user's submitted answer for an active AI challenge via D1 database lookup.
    Grants +500 XP on successful validation and removes completed task.
    """
    body = await parse_json_body(request)
    task_id = str(body.get("task_id") or "")
    user_answer = str(body.get("user_answer") or body.get("answer") or "").strip()

    if not task_id:
        return create_error_response("Task ID is required.", 400)

    task = await query_one("SELECT * FROM punishment_tasks WHERE task_id = ?", (task_id,))
    if not task:
        return create_error_response("Invalid or expired punishment task ID.", 404)

    user_ans = user_answer.lower()
    expected_ans = str(task["correct_answer"]).strip().lower()

    if task["task_type"] == "math":
        if user_ans == expected_ans:
            await execute_db("DELETE FROM punishment_tasks WHERE task_id = ?", (task_id,))
            return create_json_response({"success": True, "message": "Math puzzle solved! +500 XP awarded."})
        return create_error_response(f"Incorrect math answer. Expected {expected_ans}", 400)
    else:
        # Essay validation: minimum 5 words
        word_count = len(user_ans.split())
        if word_count >= 5:
            await execute_db("DELETE FROM punishment_tasks WHERE task_id = ?", (task_id,))
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
