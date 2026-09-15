import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createCompanyWithOwner, createSessionForUser, issueSessionToken } from "@/lib/saas-auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const nombre = String(payload?.nombre ?? "").trim();
  const email = String(payload?.email ?? "").trim().toLowerCase();
  const password = String(payload?.password ?? "");
  const companyName = String(payload?.companyName ?? "").trim() || `${nombre || "Mi"} empresa`;

  if (!nombre || !email || !password) {
    return NextResponse.json(
      { ok: false, message: "Nombre, email y contraseña son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const created = createCompanyWithOwner({
      nombre: companyName,
      email,
      password,
      nombrePersona: nombre,
    });

    const sessionToken = issueSessionToken(created.user.id);
    const cookieStore = await cookies();
    cookieStore.set("stockflow_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    createSessionForUser(created.user.id, {
      token: sessionToken,
      companyId: created.company.id,
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
    });

    return NextResponse.json({
      ok: true,
      data: {
        user: { ...created.user, password: undefined },
        company: created.company,
        subscription: created.subscription,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar la cuenta.";
    return NextResponse.json(
      { ok: false, message },
      { status: 409 }
    );
  }
}
