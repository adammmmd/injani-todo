import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { createSession, buildSessionCookie } from "@/lib/session";
import path from "path";

const db = new Database(path.join(process.cwd(), "auth.db"));

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cookieHeader = req.headers.get("cookie") || "";
  const challengeId = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("passkey_challenge_id="))
    ?.split("=")[1]?.trim();

  if (!challengeId) return Response.json({ error: "No challenge" }, { status: 400 });

  const challenge = db.prepare(
    "SELECT * FROM passkey_challenge WHERE id = ? AND expiresAt > ?"
  ).get(challengeId, Date.now()) as { challenge: string } | undefined;

  if (!challenge) return Response.json({ error: "Invalid challenge" }, { status: 400 });

  const passkey = db.prepare(
    "SELECT * FROM passkey WHERE credentialID = ?"
  ).get(body.id) as {
    publicKey: string;
    counter: number;
    transports: string;
    userId: string;
  } | undefined;

  if (!passkey) return Response.json({ error: "Passkey not found" }, { status: 400 });

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: "http://localhost:3000",
    expectedRPID: "localhost",
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

  db.prepare("UPDATE passkey SET counter = ? WHERE credentialID = ?").run(
    verification.authenticationInfo.newCounter,
    body.id
  );
  db.prepare("DELETE FROM passkey_challenge WHERE id = ?").run(challengeId);

  const token = createSession(passkey.userId);
  const cookie = await buildSessionCookie(token, process.env.BETTER_AUTH_SECRET!);

  const response = Response.json({ success: true });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
