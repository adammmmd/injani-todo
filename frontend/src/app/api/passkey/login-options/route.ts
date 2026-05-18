import { generateAuthenticationOptions } from "@simplewebauthn/server";
import Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import path from "path";

const db = new Database(path.join(process.cwd(), "auth.db"));

export async function POST(req: NextRequest) {
  const options = await generateAuthenticationOptions({
    rpID: "localhost",
    userVerification: "preferred",
  });

  const challengeId = randomUUID();
  db.prepare(
    "INSERT INTO passkey_challenge (id, challenge, userId, expiresAt) VALUES (?, ?, ?, ?)"
  ).run(challengeId, options.challenge, null, Date.now() + 5 * 60 * 1000);

  const response = Response.json(options);
  response.headers.set("Set-Cookie", `passkey_challenge_id=${challengeId}; Path=/; HttpOnly`);
  return response;
}
