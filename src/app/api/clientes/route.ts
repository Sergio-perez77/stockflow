import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb, writeDb } from "@/lib/db";
import { requireTenant, tenantRecordAccess } from "@/lib/saas-auth";

export const dynamic = "force-dynamic";

function sanitizeClienteRecord(record: Record<string, unknown>, companyId: string) {
  const next = { ...record };
  if (typeof next.id === "undefined") {
    next.id = Date.now();
  }
  next.companyId = companyId;
  return next;
}

export async function GET() {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const db = readDb();
  const clientes = Array.isArray(db.clientes) ? db.clientes : [];
  const filtered = clientes.filter((cliente) => tenantRecordAccess(cliente as { companyId?: string | null }, tenant.companyId));

  return NextResponse.json({ ok: true, data: filtered });
}

export async function POST(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => []);
  const db = readDb();
  const clientes = Array.isArray(db.clientes) ? db.clientes : [];
  const currentTenantClientes = clientes.filter((cliente) => tenantRecordAccess(cliente as { companyId?: string | null }, tenant.companyId));

  const incoming = Array.isArray(body) ? body : [body];
  const nextClientes = incoming.map((item) => sanitizeClienteRecord((item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : {}) as Record<string, unknown>, tenant.companyId));
  const finalClientes = Array.isArray(body) ? nextClientes : [...currentTenantClientes, ...nextClientes];

  writeDb({ ...db, clientes: finalClientes });
  return NextResponse.json({ ok: true, data: finalClientes });
}

export async function PUT(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const db = readDb();
  const clientes = Array.isArray(db.clientes) ? db.clientes : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id del cliente." }, { status: 400 });
  }

  const currentIndex = clientes.findIndex((cliente) => String((cliente as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Cliente no encontrado." }, { status: 404 });
  }

  if (!tenantRecordAccess(clientes[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para modificar este cliente." }, { status: 403 });
  }

  const updated = sanitizeClienteRecord({ ...(clientes[currentIndex] as Record<string, unknown>), ...(body as Record<string, unknown>), id }, tenant.companyId);
  const nextClientes = [...clientes];
  nextClientes[currentIndex] = updated;
  writeDb({ ...db, clientes: nextClientes });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const db = readDb();
  const clientes = Array.isArray(db.clientes) ? db.clientes : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id del cliente." }, { status: 400 });
  }

  const currentIndex = clientes.findIndex((cliente) => String((cliente as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Cliente no encontrado." }, { status: 404 });
  }

  if (!tenantRecordAccess(clientes[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para eliminar este cliente." }, { status: 403 });
  }

  const nextClientes = clientes.filter((cliente) => String((cliente as Record<string, unknown>).id ?? "") !== id);
  writeDb({ ...db, clientes: nextClientes });

  return NextResponse.json({ ok: true, deletedId: id });
}
