# Frontend — Next.js + Better Auth

## Stack

- Next.js 15 (App Router)
- Better Auth v1.6.11
- Kysely + better-sqlite3 + @better-auth/kysely-adapter
- @simplewebauthn/browser (Passkey)
- jose (JWT)
- Tailwind CSS

## Setup

```bash
npm install
node migrate.mjs   # create auth.db tables
npm run dev
```

Open http://localhost:3000

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
3. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Copy Client ID and Secret to `.env.local`

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...all]` | GET/POST | Better Auth handler |
| `/api/auth/token` | GET | Exchange session for JWT (via FastAPI) |
| `/api/passkey/register-options` | POST | Generate WebAuthn registration options |
| `/api/passkey/register-verify` | POST | Verify and store passkey |
| `/api/passkey/login-options` | POST | Generate WebAuthn authentication options |
| `/api/passkey/login-verify` | POST | Verify passkey and create session |

## Auth Flow

1. User clicks "Sign in with Google" → Better Auth handles OAuth
2. On login, browser auto-checks for passkey (silent fail if none)
3. After login, user is offered to register a passkey (once)
4. For subsequent visits, passkey login is attempted automatically
5. JWT is fetched from `/api/auth/token` and cached in memory (1 hour)
6. JWT auto-refreshes when less than 60 seconds from expiry

## Database

`auth.db` (SQLite) — managed by Better Auth + manual passkey tables:

| Table | Description |
|-------|-------------|
| `user` | User accounts |
| `session` | Active sessions |
| `account` | OAuth provider links |
| `verification` | Email verification tokens |
| `passkey` | WebAuthn credentials |
| `passkey_challenge` | Temporary WebAuthn challenges |

## Important Notes

### better-sqlite3 path
Auth DB path must use `path.join(process.cwd(), "auth.db")` — relative `"./auth.db"`
resolves incorrectly depending on working directory.

### Session token format
Better Auth signs cookies as `encodeURIComponent(token + "." + btoa(HMAC-SHA256(token, secret)))`.
Token format: 32-char alphanumeric (not UUID).

### Passkey implementation
Better Auth v1.6.11 has no passkey plugin. Manual implementation uses:
- `generateRegistrationOptions` / `verifyRegistrationResponse` from `@simplewebauthn/server`
- `startRegistration` / `startAuthentication` from `@simplewebauthn/browser`
