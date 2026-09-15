import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/saas-auth";

export async function GET() {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Sin sesión." }, { status: 401 });
  }

  const db = readDb();
  const sessions = Array.isArray(db.sessions) ? db.sessions : [];
  const session = sessions.find((entry) => {
    const candidate = entry as { sessionTokenHash?: string; revokedAt?: string | null; userId?: string };
    return candidate.sessionTokenHash === hashSessionToken(token) && !candidate.revokedAt;
  });

  if (!session) {
    return NextResponse.json({ ok: false, message: "Sesión inválida." }, { status: 401 });
  }

  const userId = String((session as { userId?: string }).userId ?? "");
  const user = (Array.isArray(db.users) ? db.users : []).find((entry) => String((entry as { id?: string }).id ?? "") === userId) as
    | { id: string; email: string; nombre?: string; role?: string; globalRole?: string }
    | undefined;

  if (!user) {
    return NextResponse.json({ ok: false, message: "Usuario no encontrado." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      nombre: user.nombre ?? "Usuario",
      email: user.email,
      role: user.role ?? "user",
      globalRole: user.globalRole ?? null,
    },
  });
}
