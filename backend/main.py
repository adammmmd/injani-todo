from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import todos
from database import engine, Base
import jwt
import os
import httpx
from pathlib import Path
import os

load_dotenv(Path(__file__).parent / ".env")

print(f"SECRET: {os.getenv('BETTER_AUTH_SECRET', 'NOT FOUND')[:10]}...")
print(f"CWD: {os.getcwd()}")

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Get allowed origins from environment variable
ALLOWED_ORIGINS = [
    os.getenv("NEXTJS_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(todos.router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/auth/token")
async def get_token(request: Request):
    body = await request.json()
    session_token = body.get("sessionToken")

    if not session_token:
        raise HTTPException(status_code=401, detail="No session token")

    secret = os.getenv("BETTER_AUTH_SECRET", "")
    nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")

    import hmac, hashlib, base64
    from urllib.parse import quote

    key = secret.encode('utf-8')
    msg = session_token.encode('utf-8')
    sig = hmac.new(key, msg, hashlib.sha256).digest()
    base64_sig = base64.b64encode(sig).decode()
    signed = quote(f"{session_token}.{base64_sig}", safe="")

    # pakai __Secure- prefix untuk production (HTTPS)
    is_production = nextjs_url.startswith("https")
    cookie_name = "__Secure-better-auth.session_token" if is_production else "better-auth.session_token"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{nextjs_url}/api/auth/get-session",
            headers={"Cookie": f"{cookie_name}={signed}"}
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")

    data = response.json()
    if not data or not data.get("user"):
        raise HTTPException(status_code=401, detail="Invalid session")

    user = data["user"]

    token = jwt.encode(
        {
            "userId": user["id"],
            "email": user["email"],
            "exp": __import__("datetime").datetime.utcnow() + __import__("datetime").timedelta(hours=1),
        },
        secret,
        algorithm="HS256"
    )

    return {"token": token}