# Frontend — Next.js + Better Auth

## Stack
- Next.js 15 (App Router)
- Better Auth v1.6.11
- Kysely + better-sqlite3
- @simplewebauthn/browser (Passkey)
- Tailwind CSS

## Setup

```bash
npm install
node migrate.mjs   # create auth.db tables
npm run dev
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_URL=http://localhost:8000
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

## Auth Routes

| Route | Description |
|-------|-------------|
| `GET/POST /api/auth/[...all]` | Better Auth handler |
| `POST /api/passkey/register-options` | Generate WebAuthn registration options |
| `POST /api/passkey/register-verify` | Verify and store passkey |
| `POST /api/passkey/login-options` | Generate WebAuthn authentication options |
| `POST /api/passkey/login-verify` | Verify passkey and create session |
| `GET /api/todos` | Proxy → FastAPI GET /todos |
| `POST /api/todos` | Proxy → FastAPI POST /todos |
| `PATCH /api/todos/[id]/complete` | Proxy → FastAPI PATCH /todos/{id}/complete |

## Database

`auth.db` (SQLite) contains: `user`, `session`, `account`, `verification`, `passkey`, `passkey_challenge`