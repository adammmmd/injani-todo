import { auth } from "@/lib/auth";
import { createJWT } from "@/lib/jwt";
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const jwtToken = await createJWT(session.user.id, session.user.email);
  const res = await fetch(`${BACKEND_URL}/todos/`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  return Response.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const jwtToken = await createJWT(session.user.id, session.user.email);
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/todos/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(body),
  });
  return Response.json(await res.json(), { status: res.status });
}


// import { auth } from "@/lib/auth";
// import { NextRequest } from "next/server";

// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// export async function GET(req: NextRequest) {
//   const session = await auth.api.getSession({ headers: req.headers });
//   if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

//   console.log("session token:", session.session.token);

//   const res = await fetch(`${BACKEND_URL}/todos/`, {
//     headers: { Authorization: `Bearer ${session.session.token}` },
//   });
//   return Response.json(await res.json(), { status: res.status });
// }

// export async function POST(req: NextRequest) {
//   const session = await auth.api.getSession({ headers: req.headers });
//   if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();
//   const res = await fetch(`${BACKEND_URL}/todos/`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${session.session.token}`,
//     },
//     body: JSON.stringify(body),
//   });
//   return Response.json(await res.json(), { status: res.status });
// }