import hmac
import hashlib
import base64
import os
from urllib.parse import quote
from fastapi import HTTPException, Request
import httpx

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")

def sign_token(token: str, secret: str) -> str:
    key = secret.encode('utf-8')
    msg = token.encode('utf-8')
    sig = hmac.new(key, msg, hashlib.sha256).digest()
    base64_sig = base64.b64encode(sig).decode()
    combined = f"{token}.{base64_sig}"
    return quote(combined, safe="")

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    secret = os.getenv("BETTER_AUTH_SECRET", "")
    signed = sign_token(token, secret)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{NEXTJS_URL}/api/auth/get-session",
            headers={"Cookie": f"better-auth.session_token={signed}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    data = response.json()
    if not data or not data.get("user"):
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return data["user"]