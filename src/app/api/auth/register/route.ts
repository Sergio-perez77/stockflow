import { NextResponse } from "next/server";

import { createUser, getUsers, normalizeUser } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { createBillingEventRecord, createCompanyRecord, createUserCompanyRecord, generateId } from "@/lib/saas";

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

  const users = getUsers();
  const existing = users.find((user) => user.email.toLowerCase() === email);
  if (existing) {
    return NextResponse.json(
      { ok: false, message: "Ya existe un usuario con ese email." },
      { status: 409 }
    );
  }

  const nextUser = createUser(users, {
    id: generateId("user"),
    nombre,
    email,
    password,
    role: "user",
    product: "stockflow",
    plan: "standard",
    company: companyName,
    subscriptionStatus: "trial",
    trialEnabled: true,
  });

  if (!nextUser) {
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el usuario." },
      { status: 500 }
    );
  }

  const db = readDb();
  const company = createCompanyRecord({
    nombre: companyName,
    currency: "ARS",
    status: "trial",
  });

  const companyUser = createUserCompanyRecord({
    userId: nextUser.id,
    companyId: company.id,
    role: "owner",
    isOwner: true,
  });

  const nextDb = {
    ...db,
    companies: [...(Array.isArray(db.companies) ? db.companies : []), company],
    userCompanies: [...(Array.isArray(db.userCompanies) ? db.userCompanies : []), companyUser],
    billingEvents: [
      ...((Array.isArray(db.billingEvents) ? db.billingEvents : []) as typeof db.billingEvents),
      createBillingEventRecord({
        companyId: company.id,
        eventType: "trial_started",
        occurredAt: new Date().toISOString(),
        actorUserId: nextUser.id,
        payload: { source: "register", product: nextUser.product ?? "stockflow" },
      }),
    ],
  };

  writeDb(nextDb);

  return NextResponse.json({
    ok: true,
    data: {
      user: {
        ...normalizeUser(nextUser),
        password: undefined,
      },
      company,
    },
  });
}
