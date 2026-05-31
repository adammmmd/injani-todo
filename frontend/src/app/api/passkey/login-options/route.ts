import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { dbRun, isProduction } from "@/lib/db";

const RPID = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : "localhost";

export async function POST(req: NextRequest) {
  const options = await generateAuthenticationOptions({
    rpID: RPID,
    userVerification: "preferred",
  });

  const challengeId = randomUUID();
  await dbRun(
    "INSERT INTO passkey_challenge (id, challenge, userId, expiresAt) VALUES (?, ?, ?, ?)",
    [challengeId, options.challenge, null, Date.now() + 5 * 60 * 1000]
  );

  const response = Response.json(options);
  const secure = isProduction ? "; Secure" : "";
  response.headers.set("Set-Cookie", `passkey_challenge_id=${challengeId}; Path=/; HttpOnly${secure}`);
  return response;
}