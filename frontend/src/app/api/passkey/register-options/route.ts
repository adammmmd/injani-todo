import { auth } from "@/lib/auth";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { dbExecute, dbRun, isProduction } from "@/lib/db";

const RPID = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : "localhost";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;

  const existingPasskeys = await dbExecute(
    "SELECT credentialID FROM passkey WHERE userId = ?",
    [user.id]
  ) as { credentialID: string }[];

  const options = await generateRegistrationOptions({
    rpName: "Injani Todo",
    rpID: RPID,
    userName: user.email,
    userDisplayName: user.name || user.email,
    excludeCredentials: existingPasskeys.map((pk) => ({ id: pk.credentialID })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const challengeId = randomUUID();
  await dbRun(
    "INSERT INTO passkey_challenge (id, challenge, userId, expiresAt) VALUES (?, ?, ?, ?)",
    [challengeId, options.challenge, user.id, Date.now() + 5 * 60 * 1000]
  );

  const response = Response.json(options);
  const secure = isProduction ? "; Secure" : "";
  response.headers.set("Set-Cookie", `passkey_challenge_id=${challengeId}; Path=/; HttpOnly${secure}`);
  return response;
}