import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { readDb } from "@/lib/db";
import { getUserByEmail, hashSessionToken, issueSessionToken } from "@/lib/saas-auth";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: "Email y contraseña requeridos." },
      { status: 400 }
    );
  }

  const db = readDb();
  const users = Array.isArray(db.users) ? db.users : [];
  const user = users.find((entry) => String((entry as { email?: string }).email ?? "").trim().toLowerCase() === email) as
    | { id: string; email: string; password?: string; nombre?: string; role?: string; globalRole?: string; companyId?: string | null }
    | undefined;

  if (!user || !user.password) {
    return NextResponse.json({ ok: false, message: "Credenciales inválidas." }, { status: 401 });
  }

  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    return NextResponse.json({ ok: false, message: "Credenciales inválidas." }, { status: 401 });
  }

  const sessionToken = issueSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set("stockflow_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const { createSessionForUser } = await import("@/lib/saas-auth");
  createSessionForUser(user.id, {
    token: sessionToken,
    companyId: user.companyId ?? null,
    userAgent: request.headers.get("user-agent"),
    ipAddress: request.headers.get("x-forwarded-for") ?? null,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      nombre: user.nombre ?? "Usuario",
      email: user.email,
      role: user.role ?? "user",
      globalRole: user.globalRole ?? null,
    },
    session: { tokenHash: hashSessionToken(sessionToken) },
  });
}
