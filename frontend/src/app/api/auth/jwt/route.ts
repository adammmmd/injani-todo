import { auth } from "@/lib/auth";
import { createJWT } from "@/lib/jwt";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const token = await createJWT(session.user.id, session.user.email);
  return Response.json({ token });
}