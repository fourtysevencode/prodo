from fastapi import FastAPI, Request
from pydantic import BaseModel

#  Serve HTML on / later
# environment = jinja2.Environment()
# template = environment.from_string("Hello, {{ name }}!")


app = FastAPI()


@app.get("/")
async def root():
    return "alive"

# ---------- Request Models ----------

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------- Authentication Endpoints ----------

@app.post("/auth/register")
async def register(user: RegisterRequest):
    """
    creates acc , placeholder for now
    """

    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "username": user.username,
            "email": user.email
        }
    }


@app.post("/auth/login")
async def login(user: LoginRequest):
    """
    for login, doesnt check passwrd as of now
    """

    return {
        "success": True,
        "token": "demo-jwt-token",
        "user": {
            "email": user.email
        }
    }


# ---------- users endspoint ----------

@app.get("/users/me")
async def get_current_user():
    return {
        "username": "ritish",
        "email": "ritish@example.com",
        "total_lifetime_points": 2500,
        "current_balance": 600
    }


class SyncRequest(BaseModel):
    points_earned_since_last_sync: int
    current_multiplier: float

@app.post("/users/sync")
async def sync(data: SyncRequest):
    return {
        "success": True,
        "points_added": data.points_earned_since_last_sync,
        "multiplier": data.current_multiplier
    }
