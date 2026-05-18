import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // kirim session token ke FastAPI untuk ditukar jadi JWT
  const res = await fetch(`${BACKEND_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken: session.session.token }),
  });

  if (!res.ok) return Response.json({ error: "Failed to get token" }, { status: 401 });

  return Response.json(await res.json());
}