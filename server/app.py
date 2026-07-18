from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel
import sqlite3
import hashlib
import base64
import json
import os
import time
import urllib.request
import secrets
from typing import Any, Dict, List, Optional

from utils.focus_score import calculate_focus_score

app = FastAPI(title="Prodo Focus Engine API")

# Allow local Vite dev server, hosted Pages preview, and Tauri desktop to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:1420",      # Tauri desktop dev server
        "http://127.0.0.1:1420",
        "tauri://localhost",          # Tauri production webview origin
        "https://tauri.localhost",
        "https://prodo-live.pages.dev",
        "https://website-dev.prodo-live.pages.dev",
        "https://prodo.live",
        "http://prodo.live",
        "https://www.prodo.live",
        "http://www.prodo.live",
        "https://cv.prodo.live",
        "http://cv.prodo.live",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = str(BASE_DIR / "database.db")
_rolling_scores_by_session = {}

# ── Database Initialization ──────────────────────────────────────────────────

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        xp INTEGER DEFAULT 0,
        current_multiplier REAL DEFAULT 1.0,
        total_lifetime_points INTEGER DEFAULT 0,
        current_balance INTEGER DEFAULT 0,
        auth_token TEXT
    )
    """)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN auth_token TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass
    # Friends table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS friends (
        user_id INTEGER,
        friend_id INTEGER,
        PRIMARY KEY (user_id, friend_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(friend_id) REFERENCES users(id)
    )
    """)
    # Active Co-Op session links
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS coop_sessions (
        session_id TEXT PRIMARY KEY,
        host_user_id INTEGER,
        friend_user_id INTEGER,
        is_active INTEGER DEFAULT 1,
        started_at REAL
    )
    """)
    # Seed dummy users
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, email, password_hash, xp, total_lifetime_points, current_balance) VALUES ('A', 'a@prodo.live', '', 2450, 2450, 2450)")
        cursor.execute("INSERT INTO users (username, email, password_hash, xp, total_lifetime_points, current_balance) VALUES ('B', 'b@prodo.live', '', 1980, 1980, 1980)")
        cursor.execute("INSERT INTO users (username, email, password_hash, xp, total_lifetime_points, current_balance) VALUES ('C', 'c@prodo.live', '', 1200, 1200, 1200)")
    conn.commit()
    conn.close()

init_db()

# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_user_by_token(auth_header: Optional[str]) -> Dict[str, Any]:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
    token = auth_header.replace("Bearer ", "").strip()
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE auth_token = ?", (token,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="User session invalid or expired")
    return dict(user)

def decode_google_credential(credential: str) -> Optional[Dict[str, Any]]:
    try:
        parts = credential.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            payload_b64 += "=" * (-len(payload_b64) % 4)
            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            return json.loads(payload_bytes.decode("utf-8"))
    except Exception as e:
        print(f"Failed to decode Google credential: {e}")
    return None

def call_gemini_api(prompt: str) -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return ""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini API call failed: {e}")
    return ""

# ---------- Core Pages Serving ----------

@app.get("/")
async def root():
    return FileResponse(BASE_DIR / "index.html")

# ---------- CV Model Functionality ----------

@app.post("/check-focus")
async def check_focus(
    frame: UploadFile = File(...),
    session_id: str = Form("default"),
    include_debug: bool = Form(False),
    prefer_mediapipe: bool = Form(True),
):
    if not frame.content_type or not frame.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="frame must be an image upload")

    frame_bytes = await frame.read()
    if not frame_bytes:
        raise HTTPException(status_code=400, detail="uploaded frame is empty")

    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    buffer = np.frombuffer(frame_bytes, dtype=np.uint8)
    decoded_frame = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if decoded_frame is None:
        raise HTTPException(status_code=400, detail="could not decode uploaded image frame")

    rolling_scores = _rolling_scores_by_session.setdefault(session_id, [])

    try:
        result = calculate_focus_score(
            decoded_frame,
            rolling_scores,
            include_debug=include_debug,
            prefer_mediapipe=prefer_mediapipe,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"session_id": session_id, **result}

# ---------- Request Models ----------

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str

class SyncRequest(BaseModel):
    points_earned_since_last_sync: int
    current_multiplier: float

class FriendRequest(BaseModel):
    username: str

class CoopCreateRequest(BaseModel):
    friend_username: str

class CoopJoinRequest(BaseModel):
    session_id: str

class AITaskGenRequest(BaseModel):
    type: str # "math" or "essay"

class AITaskVerifyRequest(BaseModel):
    task_id: str
    answer: str

# ---------- Authentication Endpoints ----------

@app.post("/auth/register")
async def register(user: RegisterRequest):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    pwd_hash = hash_password(user.password)
    token = secrets.token_hex(32)
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, xp, total_lifetime_points, current_balance, auth_token) VALUES (?, ?, ?, 0, 0, 0, ?)",
            (user.username.strip(), user.email.strip().lower(), pwd_hash, token)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    conn.close()

    return {
        "success": True,
        "token": token,
        "user": {
            "username": user.username,
            "email": user.email
        }
    }

@app.post("/auth/login")
async def login(user: LoginRequest):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (user.email.strip().lower(),))
    db_user = cursor.fetchone()

    if not db_user:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    pwd_hash = hash_password(user.password)
    if db_user["password_hash"] != pwd_hash:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = secrets.token_hex(32)
    cursor.execute("UPDATE users SET auth_token = ? WHERE id = ?", (token, db_user["id"]))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "token": token,
        "user": {
            "username": db_user["username"],
            "email": db_user["email"]
        }
    }

@app.post("/auth/google")
async def google_login(payload: GoogleLoginRequest):
    data = decode_google_credential(payload.credential)
    if not data:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    google_id = data.get("sub", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google token does not contain email")

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ? OR google_id = ?", (email, google_id))
    db_user = cursor.fetchone()
    
    preferred_username = name.replace(" ", "").strip()
    if not preferred_username:
        preferred_username = email.split("@")[0]

    token = secrets.token_hex(32)

    if not db_user:
        # Create new user
        username = preferred_username
        try:
            cursor.execute(
                "INSERT INTO users (username, email, google_id, xp, total_lifetime_points, current_balance, auth_token) VALUES (?, ?, ?, 0, 0, 0, ?)",
                (username, email, google_id, token)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            username = f"{username}{int(time.time()) % 1000}"
            cursor.execute(
                "INSERT INTO users (username, email, google_id, xp, total_lifetime_points, current_balance, auth_token) VALUES (?, ?, ?, 0, 0, 0, ?)",
                (username, email, google_id, token)
            )
            conn.commit()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        db_user = cursor.fetchone()
    else:
        # Update existing
        update_fields = ["auth_token = ?"]
        params = [token]
        
        if not db_user["google_id"]:
            update_fields.append("google_id = ?")
            params.append(google_id)
            
        if db_user["username"] in ("A", "B", "C", "demo") or not db_user["google_id"]:
            try:
                cursor.execute("UPDATE users SET username = ? WHERE id = ?", (preferred_username, db_user["id"]))
                conn.commit()
            except sqlite3.IntegrityError:
                preferred_username = f"{preferred_username}{int(time.time()) % 1000}"
                cursor.execute("UPDATE users SET username = ? WHERE id = ?", (preferred_username, db_user["id"]))
                conn.commit()
        
        params.append(db_user["id"])
        cursor.execute(
            f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?",
            tuple(params)
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (db_user["id"],))
        db_user = cursor.fetchone()

    conn.close()
    return {
        "success": True,
        "token": token,
        "user": {
            "username": db_user["username"],
            "email": db_user["email"]
        }
    }

# ---------- Users Endpoints ----------

@app.get("/users/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    return {
        "username": user["username"],
        "email": user["email"],
        "total_lifetime_points": user["total_lifetime_points"],
        "current_balance": user["current_balance"]
    }

@app.post("/users/sync")
async def sync(data: SyncRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    
    # Check if this user is in an active co-op session
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM coop_sessions 
        WHERE (host_user_id = ? OR friend_user_id = ?) AND is_active = 1
    """, (user["id"], user["id"]))
    in_coop = cursor.fetchone()[0] > 0

    # Boost factors: Co-Op grants 2.5x points boost
    multiplier_boost = 2.5 if in_coop else 1.0
    added_points = int(data.points_earned_since_last_sync * multiplier_boost)

    new_xp = user["xp"] + added_points
    new_lifetime = user["total_lifetime_points"] + added_points
    new_balance = user["current_balance"] + added_points

    cursor.execute(
        "UPDATE users SET xp = ?, total_lifetime_points = ?, current_balance = ?, current_multiplier = ? WHERE id = ?",
        (new_xp, new_lifetime, new_balance, data.current_multiplier, user["id"])
    )
    conn.commit()
    conn.close()

    return {
        "success": True,
        "points_added": added_points,
        "multiplier": data.current_multiplier * multiplier_boost
    }

# ---------- Friends & Social Endpoints ----------

@app.post("/friends/add")
async def add_friend(req: FriendRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (req.username.strip(),))
    friend = cursor.fetchone()
    if not friend:
        conn.close()
        raise HTTPException(status_code=404, detail="Username not found")
        
    if friend["id"] == user["id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="You cannot add yourself as friend")

    try:
        cursor.execute("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", (user["id"], friend["id"]))
        cursor.execute("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", (friend["id"], user["id"]))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return {"success": True, "message": "Already friends"}

    conn.close()
    return {"success": True, "message": f"Successfully added {req.username} as a friend"}

@app.get("/friends/list")
async def get_friends_list(authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.username, u.total_lifetime_points as points FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
    """, (user["id"],))
    friends_list = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"success": True, "friends": friends_list}

# ---------- Leaderboard Endpoints ----------

@app.get("/leaderboard/global")
async def get_global_leaderboard():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT username, total_lifetime_points as points FROM users ORDER BY points DESC LIMIT 10")
    leaders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"success": True, "leaderboard": leaders}

@app.get("/leaderboard/friends")
async def get_friends_leaderboard(authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Query yourself + friends
    cursor.execute("""
        SELECT username, total_lifetime_points as points FROM users WHERE id = ?
        UNION
        SELECT u.username, u.total_lifetime_points as points FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
        ORDER BY points DESC
    """, (user["id"], user["id"]))
    
    leaders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"success": True, "leaderboard": leaders}

# ---------- Real-time Co-Op Session Manager ----------

@app.post("/coop/create")
async def create_coop(req: CoopCreateRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (req.friend_username.strip(),))
    friend = cursor.fetchone()
    if not friend:
        conn.close()
        raise HTTPException(status_code=404, detail="Friend username not found")
        
    session_id = f"coop-{int(time.time())}-{user['id']}"
    
    # Clear any old active session
    cursor.execute("UPDATE coop_sessions SET is_active = 0 WHERE host_user_id = ? OR friend_user_id = ?", (user["id"], user["id"]))
    cursor.execute("UPDATE coop_sessions SET is_active = 0 WHERE host_user_id = ? OR friend_user_id = ?", (friend["id"], friend["id"]))
    
    cursor.execute(
        "INSERT INTO coop_sessions (session_id, host_user_id, friend_user_id, is_active, started_at) VALUES (?, ?, ?, 1, ?)",
        (session_id, user["id"], friend["id"], time.time())
    )
    conn.commit()
    conn.close()
    return {"success": True, "session_id": session_id}

@app.post("/coop/join")
async def join_coop(req: CoopJoinRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coop_sessions WHERE session_id = ? AND is_active = 1", (req.session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Active Co-Op session not found")
        
    if session["friend_user_id"] != user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You are not authorized for this Co-Op session")
        
    conn.close()
    return {"success": True, "message": "Joined Co-Op focus room"}

@app.post("/coop/end")
async def end_coop(req: CoopJoinRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("UPDATE coop_sessions SET is_active = 0 WHERE session_id = ?", (req.session_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Co-Op session ended"}

# WebSockets representing real-time Durable Object coordination
class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
        self.active_rooms[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_rooms:
            self.active_rooms[room_id].remove(websocket)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_rooms:
            for connection in self.active_rooms[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/coop/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            # Read updates and broadcast real-time telemetry back
            data = await websocket.receive_text()
            await manager.broadcast(f"TELEMETRY: {data}", session_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        await manager.broadcast("SYSTEM_INFO: Participant disconnected", session_id)

# ---------- AI Task Waiver Endpoints ----------

# In-memory store for pending AI tasks
_pending_ai_tasks: Dict[str, Dict[str, Any]] = {}

@app.post("/ai/generate-task")
async def generate_task(req: AITaskGenRequest, authorization: Optional[str] = Header(None)):
    get_current_user_by_token(authorization) # ensure signed in
    task_id = f"task-{int(time.time())}"
    
    if req.type == "math":
        prompt = "Solve for x: 7x - 24 = 32"
        answer = "8"
        
        # Try to call Gemini to generate a hard algebra equation if API Key is available
        llm_response = call_gemini_api(
            "Generate one algebra equation to solve, return ONLY a valid JSON object with keys 'prompt' (e.g. 'Solve for x: 3x + 12 = 33') and 'answer' (e.g. '7'). Do not wrap in markdown code blocks."
        )
        if llm_response:
            try:
                clean_json = llm_response.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)
                prompt = parsed.get("prompt", prompt)
                answer = str(parsed.get("answer", answer)).strip()
            except Exception:
                pass
                
        _pending_ai_tasks[task_id] = {"type": "math", "prompt": prompt, "answer": answer}
        return {"success": True, "task_id": task_id, "prompt": prompt, "type": "math"}
        
    else: # essay
        prompt = "Explain in exactly one sentence how an API differs from a database."
        
        llm_response = call_gemini_api(
            "Generate a quick essay prompt asking the user to explain a computer science concept in 30 words. Return ONLY a JSON object with keys 'prompt'. Do not wrap in markdown code blocks."
        )
        if llm_response:
            try:
                clean_json = llm_response.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)
                prompt = parsed.get("prompt", prompt)
            except Exception:
                pass
                
        _pending_ai_tasks[task_id] = {"type": "essay", "prompt": prompt}
        return {"success": True, "task_id": task_id, "prompt": prompt, "type": "essay"}

@app.post("/ai/verify-task")
async def verify_task(req: AITaskVerifyRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_by_token(authorization)
    task = _pending_ai_tasks.get(req.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task ID not found")
        
    success = False
    
    if task["type"] == "math":
        success = req.answer.strip() == task["answer"]
    else:
        # Essay grading: check word count or let LLM evaluate
        word_count = len(req.answer.strip().split())
        if word_count >= 10:
            success = True # Pass standard length check
            
            # Use Gemini to evaluate if key is available
            gemini_grade = call_gemini_api(
                f"Grade this explanation for the prompt: '{task['prompt']}'. Response: '{req.answer}'. Return ONLY 'PASS' if correct or 'FAIL' if incorrect."
            )
            if gemini_grade and "FAIL" in gemini_grade.upper():
                success = False

    if success:
        # Grant XP boost to allow buy
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET xp = xp + 500 WHERE id = ?", (user["id"],))
        conn.commit()
        conn.close()
        # Remove task from pending
        del _pending_ai_tasks[req.task_id]
        return {"success": True, "message": "Task solved successfully. 500 XP granted to bypass distraction."}
        
    return {"success": False, "message": "Verification failed. Answer is incorrect or essay explanation is too short/incorrect."}
