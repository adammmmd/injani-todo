import { auth } from "@/lib/auth";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import path from "path";

const db = new Database(path.join(process.cwd(), "auth.db"));

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const cookieHeader = req.headers.get("cookie") || "";
  const challengeId = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("passkey_challenge_id="))
    ?.split("=")[1]?.trim();

  if (!challengeId) return Response.json({ error: "No challenge" }, { status: 400 });

  const challenge = db.prepare(
    "SELECT * FROM passkey_challenge WHERE id = ? AND userId = ? AND expiresAt > ?"
  ).get(challengeId, session.user.id, Date.now()) as { challenge: string } | undefined;

  if (!challenge) return Response.json({ error: "Invalid challenge" }, { status: 400 });

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: "http://localhost:3000",
    expectedRPID: "localhost",
  });

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  db.prepare(
    "INSERT INTO passkey (id, credentialID, publicKey, counter, transports, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    credential.id,
    Buffer.from(credential.publicKey).toString("base64"),
    credential.counter,
    JSON.stringify(body.response.transports || []),
    session.user.id,
    new Date().toISOString()
  );

  db.prepare("DELETE FROM passkey_challenge WHERE id = ?").run(challengeId);
  return Response.json({ success: true });
}
