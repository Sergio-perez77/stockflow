import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { revokeSession } from "@/lib/saas-auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("stockflow_session")?.value ?? null;

  if (token) {
    revokeSession(token);
  }

  cookieStore.set("stockflow_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
