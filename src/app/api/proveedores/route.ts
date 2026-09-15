import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb, writeDb } from "@/lib/db";
import { requireTenant, tenantRecordAccess } from "@/lib/saas-auth";

export const dynamic = "force-dynamic";

function sanitizeProveedorRecord(record: Record<string, unknown>, companyId: string) {
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
  const proveedores = Array.isArray(db.proveedores) ? db.proveedores : [];
  const filtered = proveedores.filter((proveedor) => tenantRecordAccess(proveedor as { companyId?: string | null }, tenant.companyId));

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
  const proveedores = Array.isArray(db.proveedores) ? db.proveedores : [];
  const currentTenantProveedores = proveedores.filter((proveedor) => tenantRecordAccess(proveedor as { companyId?: string | null }, tenant.companyId));

  const incoming = Array.isArray(body) ? body : [body];
  const nextProveedores = incoming.map((item) => sanitizeProveedorRecord((item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : {}) as Record<string, unknown>, tenant.companyId));
  const finalProveedores = Array.isArray(body) ? nextProveedores : [...currentTenantProveedores, ...nextProveedores];

  writeDb({ ...db, proveedores: finalProveedores });
  return NextResponse.json({ ok: true, data: finalProveedores });
}

export async function PUT(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const db = readDb();
  const proveedores = Array.isArray(db.proveedores) ? db.proveedores : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id del proveedor." }, { status: 400 });
  }

  const currentIndex = proveedores.findIndex((proveedor) => String((proveedor as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Proveedor no encontrado." }, { status: 404 });
  }

  if (!tenantRecordAccess(proveedores[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para modificar este proveedor." }, { status: 403 });
  }

  const updated = sanitizeProveedorRecord({ ...(proveedores[currentIndex] as Record<string, unknown>), ...(body as Record<string, unknown>), id }, tenant.companyId);
  const nextProveedores = [...proveedores];
  nextProveedores[currentIndex] = updated;
  writeDb({ ...db, proveedores: nextProveedores });

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
  const proveedores = Array.isArray(db.proveedores) ? db.proveedores : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id del proveedor." }, { status: 400 });
  }

  const currentIndex = proveedores.findIndex((proveedor) => String((proveedor as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Proveedor no encontrado." }, { status: 404 });
  }

  if (!tenantRecordAccess(proveedores[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para eliminar este proveedor." }, { status: 403 });
  }

  const nextProveedores = proveedores.filter((proveedor) => String((proveedor as Record<string, unknown>).id ?? "") !== id);
  writeDb({ ...db, proveedores: nextProveedores });

  return NextResponse.json({ ok: true, deletedId: id });
}
