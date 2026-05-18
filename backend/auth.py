import jwt
import os
from fastapi import HTTPException, Request

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    secret = os.getenv("BETTER_AUTH_SECRET", "")
    
    if not secret:
        raise HTTPException(status_code=500, detail="Server misconfiguration")

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return {
            "id": payload["userId"],
            "email": payload["email"]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")