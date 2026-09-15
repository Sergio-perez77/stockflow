import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb, writeDb } from "@/lib/db";
import { requireTenant, tenantRecordAccess } from "@/lib/saas-auth";

export const dynamic = "force-dynamic";

function sanitizeVentaRecord(record: Record<string, unknown>, companyId: string) {
  const next = { ...record };
  if (typeof next.id === "undefined") {
    next.id = Date.now();
  }
  next.companyId = companyId;
  return next;
}

function validateVentaRelations(record: Record<string, unknown> | null, companyId: string, db: ReturnType<typeof readDb>) {
  if (!record) return null;

  const products = Array.isArray(db.products) ? db.products : [];
  const clientes = Array.isArray(db.clientes) ? db.clientes : [];
  const proveedores = Array.isArray(db.proveedores) ? db.proveedores : [];

  const productName = String((record as Record<string, unknown>).producto ?? "").trim();
  if (productName) {
    const match = products.find((item) => String((item as Record<string, unknown>).nombre ?? "").toLowerCase() === productName.toLowerCase());
    if (match && !tenantRecordAccess(match as { companyId?: string | null }, companyId)) {
      throw new Error("La venta hace referencia a un producto de otra empresa.");
    }
  }

  const clientName = String((record as Record<string, unknown>).cliente ?? "").trim();
  if (clientName) {
    const match = clientes.find((item) => String((item as Record<string, unknown>).nombre ?? "").toLowerCase() === clientName.toLowerCase());
    if (match && !tenantRecordAccess(match as { companyId?: string | null }, companyId)) {
      throw new Error("La venta hace referencia a un cliente de otra empresa.");
    }
  }

  const proveedorName = String((record as Record<string, unknown>).proveedor ?? "").trim();
  if (proveedorName) {
    const match = proveedores.find((item) => String((item as Record<string, unknown>).empresa ?? "").toLowerCase() === proveedorName.toLowerCase());
    if (match && !tenantRecordAccess(match as { companyId?: string | null }, companyId)) {
      throw new Error("La venta hace referencia a un proveedor de otra empresa.");
    }
  }

  return record;
}

export async function GET() {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const db = readDb();
  const ventas = Array.isArray(db.ventas) ? db.ventas : [];
  const filtered = ventas.filter((venta) => tenantRecordAccess(venta as { companyId?: string | null }, tenant.companyId));

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
  const ventas = Array.isArray(db.ventas) ? db.ventas : [];
  const currentTenantVentas = ventas.filter((venta) => tenantRecordAccess(venta as { companyId?: string | null }, tenant.companyId));

  try {
    const incoming = Array.isArray(body) ? body : [body];
    const nextVentas = incoming.map((item) => {
      const record = (item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : {}) as Record<string, unknown>;
      validateVentaRelations(record, tenant.companyId, db);
      return sanitizeVentaRecord(record, tenant.companyId);
    });

    const finalVentas = Array.isArray(body) ? nextVentas : [...currentTenantVentas, ...nextVentas];
    writeDb({ ...db, ventas: finalVentas });
    return NextResponse.json({ ok: true, data: finalVentas });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "No se pudo guardar la venta." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const db = readDb();
  const ventas = Array.isArray(db.ventas) ? db.ventas : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id de la venta." }, { status: 400 });
  }

  const currentIndex = ventas.findIndex((venta) => String((venta as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Venta no encontrada." }, { status: 404 });
  }

  if (!tenantRecordAccess(ventas[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para modificar esta venta." }, { status: 403 });
  }

  try {
    const updated = sanitizeVentaRecord({ ...(ventas[currentIndex] as Record<string, unknown>), ...(body as Record<string, unknown>), id }, tenant.companyId);
    validateVentaRelations(updated, tenant.companyId, db);
    const nextVentas = [...ventas];
    nextVentas[currentIndex] = updated;
    writeDb({ ...db, ventas: nextVentas });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "No se pudo actualizar la venta." }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const db = readDb();
  const ventas = Array.isArray(db.ventas) ? db.ventas : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id de la venta." }, { status: 400 });
  }

  const currentIndex = ventas.findIndex((venta) => String((venta as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Venta no encontrada." }, { status: 404 });
  }

  if (!tenantRecordAccess(ventas[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para eliminar esta venta." }, { status: 403 });
  }

  const nextVentas = ventas.filter((venta) => String((venta as Record<string, unknown>).id ?? "") !== id);
  writeDb({ ...db, ventas: nextVentas });
  return NextResponse.json({ ok: true, deletedId: id });
}
