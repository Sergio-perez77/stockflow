import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { authenticate, getUsers, SESSION_KEY } from "@/lib/auth";

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

  const user = authenticate(email, password, getUsers());
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Credenciales inválidas." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_KEY, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
      plan: user.plan,
      product: user.product,
    },
  });
}
