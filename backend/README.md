# Backend — FastAPI

## Stack

- FastAPI
- SQLAlchemy + SQLite
- PyJWT (token validation)
- httpx (session validation against Better Auth)
- python-dotenv

## Setup

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Variables

Create `.env`:

```env
# Must be same value as frontend BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=your-secret-min-32-chars

# URL of Next.js app (for session validation)
NEXTJS_URL=http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/token` | Session token | Exchange session for JWT |
| `GET` | `/todos/` | JWT | List todos for authenticated user |
| `POST` | `/todos/` | JWT | Create new todo |
| `PATCH` | `/todos/{id}/complete` | JWT | Mark todo as complete |
| `GET` | `/health` | None | Health check |

## Auth Flow

### Token Exchange (`POST /auth/token`)
1. Receive `sessionToken` from Next.js in request body
2. Reconstruct signed cookie: `HMAC-SHA256(token, secret)` → `btoa()` → `encodeURIComponent()`
3. Call `GET {NEXTJS_URL}/api/auth/get-session` with signed cookie
4. Validate response, extract user info
5. Generate and return JWT (HS256, 1 hour expiry)

### Request Validation (all `/todos/*`)
1. Extract JWT from `Authorization: Bearer {token}` header
2. Verify JWT signature using `BETTER_AUTH_SECRET` (HS256)
3. Extract `userId` from JWT payload
4. Use `userId` for per-user data isolation

## Error Codes

| Code | Reason |
|------|--------|
| `401` | Missing, invalid, or expired token |
| `403` | Token valid but accessing another user's resource |
| `404` | Todo not found |
| `500` | Server misconfiguration (missing secret) |

## Database

`todos.db` (SQLite) — managed by SQLAlchemy:

| Table | Columns | Description |
|-------|---------|-------------|
| `todos` | `id`, `title`, `completed`, `user_id` | Todo items per user |

## Per-User Data Isolation

All todo queries filter by `user_id` extracted from validated JWT:

```python
# GET — only return todos owned by authenticated user
todos = db.query(Todo).filter(Todo.user_id == user["id"]).all()

# PATCH — check existence first, then ownership
todo = db.query(Todo).filter(Todo.id == todo_id).first()
if not todo:
    raise HTTPException(status_code=404)
if todo.user_id != user["id"]:
    raise HTTPException(status_code=403)  # Forbidden
```

User A cannot access User B's todos because `user_id` is injected from the
validated JWT payload, not from the request body.

## CORS

Configured to allow requests from Next.js frontend. Update `allow_origins` in
`main.py` when deploying to production.
