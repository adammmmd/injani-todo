import { randomUUID } from "crypto";
import { dbRun, isProduction } from "@/lib/db";

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

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await dbRun(
    "INSERT INTO session (id, token, userId, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    [randomUUID(), token, userId, expiresAt.toISOString(), now.toISOString(), now.toISOString()]
  );

  return token;
}

export async function buildSessionCookie(token: string, secret: string): Promise<string> {
  const signed = await signSessionToken(token, secret);
  const secure = isProduction ? "; Secure" : "";
  return `${isProduction ? "__Secure-" : ""}better-auth.session_token=${signed}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`;
}