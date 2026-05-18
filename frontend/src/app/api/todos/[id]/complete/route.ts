import { auth } from "@/lib/auth";
import { createJWT } from "@/lib/jwt";
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const jwtToken = await createJWT(session.user.id, session.user.email);
  const res = await fetch(`${BACKEND_URL}/todos/${id}/complete`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  return Response.json(await res.json(), { status: res.status });
}

// import { auth } from "@/lib/auth";
// import { NextRequest } from "next/server";

// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await params;
//   const session = await auth.api.getSession({ headers: req.headers });
//   if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

//   const res = await fetch(`${BACKEND_URL}/todos/${id}/complete`, {
//     method: "PATCH",
//     headers: { Authorization: `Bearer ${session.session.token}` },
//   });
//   return Response.json(await res.json(), { status: res.status });
// }