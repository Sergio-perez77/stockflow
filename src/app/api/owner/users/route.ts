import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSessionCookieValue, isOwnerRole } from "@/lib/auth";
import { getOwnerUsers } from "@/lib/owner";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("stockflow_session")?.value;
  const session = getSessionCookieValue(sessionCookie);

  if (!session || !isOwnerRole(session)) {
    return NextResponse.json(
      { ok: false, message: "Acceso no autorizado." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, data: getOwnerUsers() });
}
