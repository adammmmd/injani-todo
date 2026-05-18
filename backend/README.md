# Backend — FastAPI

## Stack
- FastAPI
- SQLAlchemy + SQLite
- httpx (session validation)
- python-dotenv

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Variables

Create `.env`:

```env
BETTER_AUTH_SECRET=your-secret-min-32-chars   # same as frontend
NEXTJS_URL=http://localhost:3000               # URL of Next.js app
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/todos/` | List todos for authenticated user |
| `POST` | `/todos/` | Create new todo |
| `PATCH` | `/todos/{id}/complete` | Mark todo as complete |
| `GET` | `/health` | Health check |

## Auth Flow

Every request must include `Authorization: Bearer {token}` header.

1. Extract token from `Authorization` header
2. Sign token with HMAC-SHA256 using `BETTER_AUTH_SECRET`
3. Call `GET {NEXTJS_URL}/api/auth/get-session` with signed cookie
4. If valid → extract `user.id` for data isolation
5. If invalid → return 401

## Error Codes

| Code | Reason |
|------|--------|
| 401 | Missing or invalid token |
| 403 | Token valid but accessing another user's resource |
| 404 | Todo not found |

## Database

`todos.db` (SQLite) contains: `todos` table with `id`, `title`, `completed`, `user_id`