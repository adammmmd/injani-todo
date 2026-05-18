import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

const db = new Database(path.join(process.cwd(), "auth.db"));

export function generateSessionToken(size = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

export async function signSessionToken(token: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return encodeURIComponent(`${token}.${base64}`);
}

export function createSession(userId: string): string {
  const token = generateSessionToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  db.prepare(
    "INSERT INTO session (id, token, userId, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(), token, userId,
    expiresAt.toISOString(),
    now.toISOString(),
    now.toISOString()
  );

  return token;
}

export async function buildSessionCookie(token: string, secret: string): Promise<string> {
  const signed = await signSessionToken(token, secret);
  return `better-auth.session_token=${signed}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}
