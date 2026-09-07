import { NextRequest, NextResponse } from "next/server";

import { readDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: "Email y contraseña requeridos." },
      { status: 400 }
    );
  }

  const db = readDb();
  const user = db.users.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "email" in item &&
      String((item as { email?: string }).email).toLowerCase() === String(email).trim().toLowerCase()
  ) as {
    id?: string;
    nombre?: string;
    email?: string;
    role?: string;
  } | undefined;

  if (!user || password !== "stockflow123") {
    return NextResponse.json(
      { ok: false, message: "Credenciales inválidas." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id ?? "demo-admin",
      nombre: user.nombre ?? "StockFlow Admin",
      email: user.email ?? String(email),
      role: user.role ?? "admin",
    },
  });
}
