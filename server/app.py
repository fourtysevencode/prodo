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






#class Default(WorkerEntrypoint):
#    async def fetch(self, request):
#        import asgi
#        return await asgi.fetch(app, request.js_object, self.env)
