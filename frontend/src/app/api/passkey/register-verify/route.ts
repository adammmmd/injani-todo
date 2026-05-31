import { auth } from "@/lib/auth";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { dbExecute, dbRun, isProduction } from "@/lib/db";

const RPID = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : "localhost";
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

  const challenges = await dbExecute(
    "SELECT * FROM passkey_challenge WHERE id = ? AND userId = ? AND expiresAt > ?",
    [challengeId, session.user.id, Date.now()]
  ) as { challenge: string }[];

  if (!challenges.length) return Response.json({ error: "Invalid challenge" }, { status: 400 });
  const challenge = challenges[0];

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RPID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  await dbRun(
    "INSERT INTO passkey (id, credentialID, publicKey, counter, transports, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      randomUUID(),
      credential.id,
      Buffer.from(credential.publicKey).toString("base64"),
      credential.counter,
      JSON.stringify(body.response.transports || []),
      session.user.id,
      new Date().toISOString(),
    ]
  );

  await dbRun("DELETE FROM passkey_challenge WHERE id = ?", [challengeId]);
  return Response.json({ success: true });
}