# Injani Todo App

Full-stack todo application built for Injani Systems technical assignment.

## Project Structure

├── frontend/     # Next.js 15 + Better Auth<br>
├── backend/         # FastAPI + SQLAlchemy<br>
├── docker-compose.yml<br>
├── .gitignore<br>
└── .env.example<br>

## Quick Start

### With Docker Compose (recommended)

```bash
cp .env.example .env
# Fill in .env with your values
docker-compose up
```

Open http://localhost:3000

### Without Docker

Run frontend and backend separately — see their respective READMEs.

## Environment Variables

Create `.env` in this folder:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_URL=http://backend:8000       # Docker
NEXTJS_URL=http://frontend:3000       # Docker
```

## Architecture
Browser
│
├── /api/auth/*  →  Next.js (Better Auth)  →  auth.db<br>
│
├── /api/passkey/*  →  Next.js (WebAuthn)  →  auth.db<br>
│
└── /api/todos  →  Next.js proxy<br>
│
└── Bearer token  →  FastAPI :8000<br>
│
├── sign token (HMAC-SHA256)<br>
├── GET /api/auth/get-session<br>
└── todos.db<br>

## JWT Integration Decision

Better Auth uses opaque session tokens (not JWTs). Each token is a 32-char random string signed with HMAC-SHA256 and stored as an HttpOnly cookie.

**Flow:**
1. User logs in → Better Auth creates session in `auth.db`
2. Session cookie set: `better-auth.session_token={token}.{HMAC signature}`
3. Next.js proxy reads cookie server-side via `auth.api.getSession()`
4. Raw token forwarded to FastAPI as `Authorization: Bearer {token}`
5. FastAPI reconstructs signed cookie using shared `BETTER_AUTH_SECRET`
6. FastAPI calls `GET /api/auth/get-session` to validate
7. Returns user object → used for per-user data isolation

**Tradeoffs:**
- ✅ Session revocable server-side instantly
- ✅ No JWT library needed on Python side
- ❌ FastAPI makes HTTP call to Next.js on every request (latency)
- ❌ Both services must be running simultaneously

**For production at scale:** Switch to PostgreSQL + Redis session cache, use Better Auth JWT plugin to issue short-lived JWTs, eliminating per-request validation calls.

## Brevo Email

Sender domain: `muhammadam90@gmail.com` configured via Brevo free tier.
Note: Google OAuth flow does not require transactional email. Brevo is configured for future magic link / email verification features.

## Passkey Note

Better Auth v1.6.11 does not include a passkey plugin. WebAuthn implemented manually using `@simplewebauthn/server` and `@simplewebauthn/browser`.
EOF

## How to Get Environment Values

### BETTER_AUTH_SECRET
Generate random secret:
```bash
openssl rand -base64 32
```

### GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
1. Buka https://console.cloud.google.com
2. Buat project → APIs & Services → Credentials
3. Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID dan Client Secret

### BACKEND_URL & NEXTJS_URL
- **Local dev**: `BACKEND_URL=http://localhost:8000`, tidak perlu `NEXTJS_URL`
- **Docker**: `BACKEND_URL=http://backend:8000`, `NEXTJS_URL=http://frontend:3000`
EOF