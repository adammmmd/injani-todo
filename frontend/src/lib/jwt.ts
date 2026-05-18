import { SignJWT, jwtVerify } from "jose";

const getSecret = () => new TextEncoder().encode(process.env.BETTER_AUTH_SECRET!);

export async function createJWT(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}