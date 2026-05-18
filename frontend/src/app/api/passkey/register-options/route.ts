import { auth } from "@/lib/auth";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import path from "path";

const db = new Database(path.join(process.cwd(), "auth.db"));

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const existingPasskeys = db.prepare(
    "SELECT credentialID FROM passkey WHERE userId = ?"
  ).all(user.id) as { credentialID: string }[];

  const options = await generateRegistrationOptions({
    rpName: "Injani Todo",
    rpID: "localhost",
    userName: user.email,
    userDisplayName: user.name,
    excludeCredentials: existingPasskeys.map((pk) => ({ id: pk.credentialID })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const challengeId = randomUUID();
  db.prepare(
    "INSERT INTO passkey_challenge (id, challenge, userId, expiresAt) VALUES (?, ?, ?, ?)"
  ).run(challengeId, options.challenge, user.id, Date.now() + 5 * 60 * 1000);

  const response = Response.json(options);
  response.headers.set("Set-Cookie", `passkey_challenge_id=${challengeId}; Path=/; HttpOnly`);
  return response;
}
