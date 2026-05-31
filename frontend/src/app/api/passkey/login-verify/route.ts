import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextRequest } from "next/server";
import { dbExecute, dbRun } from "@/lib/db";
import { createSession, buildSessionCookie } from "@/lib/session";

const RPID = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : "localhost";
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cookieHeader = req.headers.get("cookie") || "";
  const challengeId = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("passkey_challenge_id="))
    ?.split("=")[1]?.trim();

  if (!challengeId) return Response.json({ error: "No challenge" }, { status: 400 });

  const challenges = await dbExecute(
    "SELECT * FROM passkey_challenge WHERE id = ? AND expiresAt > ?",
    [challengeId, Date.now()]
  ) as { challenge: string }[];

  if (!challenges.length) return Response.json({ error: "Invalid challenge" }, { status: 400 });
  const challenge = challenges[0];

  const passkeys = await dbExecute(
    "SELECT * FROM passkey WHERE credentialID = ?",
    [body.id]
  ) as { publicKey: string; counter: number; transports: string; userId: string }[];

  if (!passkeys.length) return Response.json({ error: "Passkey not found" }, { status: 400 });
  const passkey = passkeys[0];

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RPID,
    credential: {
      id: body.id,
      publicKey: Buffer.from(passkey.publicKey, "base64"),
      counter: passkey.counter,
      transports: JSON.parse(passkey.transports),
    },
  });

  if (!verification.verified) {
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

  await dbRun(
    "UPDATE passkey SET counter = ? WHERE credentialID = ?",
    [verification.authenticationInfo.newCounter, body.id]
  );
  await dbRun("DELETE FROM passkey_challenge WHERE id = ?", [challengeId]);

  const token = await createSession(passkey.userId);
  const cookie = await buildSessionCookie(token, process.env.BETTER_AUTH_SECRET!);

  const response = Response.json({ success: true });
  response.headers.set("Set-Cookie", cookie);
  return response;
}