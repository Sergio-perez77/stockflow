import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb, writeDb } from "@/lib/db";
import { requireTenant, tenantRecordAccess } from "@/lib/saas-auth";

export const dynamic = "force-dynamic";

function sanitizeCompraRecord(record: Record<string, unknown>, companyId: string) {
  const next = { ...record };
  if (typeof next.id === "undefined") {
    next.id = Date.now();
  }
  next.companyId = companyId;
  return next;
}

function validateCompraRelations(record: Record<string, unknown> | null, companyId: string, db: ReturnType<typeof readDb>) {
  if (!record) return null;

  const products = Array.isArray(db.products) ? db.products : [];
  const proveedores = Array.isArray(db.proveedores) ? db.proveedores : [];

  const productName = String((record as Record<string, unknown>).producto ?? "").trim();
  if (productName) {
    const match = products.find((item) => String((item as Record<string, unknown>).nombre ?? "").toLowerCase() === productName.toLowerCase());
    if (match && !tenantRecordAccess(match as { companyId?: string | null }, companyId)) {
      throw new Error("La compra hace referencia a un producto de otra empresa.");
    }
  }

  const proveedorName = String((record as Record<string, unknown>).proveedor ?? "").trim();
  if (proveedorName) {
    const match = proveedores.find((item) => String((item as Record<string, unknown>).empresa ?? "").toLowerCase() === proveedorName.toLowerCase());
    if (match && !tenantRecordAccess(match as { companyId?: string | null }, companyId)) {
      throw new Error("La compra hace referencia a un proveedor de otra empresa.");
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
  const compras = Array.isArray(db.compras) ? db.compras : [];

  return NextResponse.json({
    ok: true,
    data: compras.filter((compra) => tenantRecordAccess(compra as { companyId?: string | null }, tenant.companyId)),
  });
}

export async function POST(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => []);
  const db = readDb();
  const compras = Array.isArray(db.compras) ? db.compras : [];
  const currentTenantCompras = compras.filter((compra) => tenantRecordAccess(compra as { companyId?: string | null }, tenant.companyId));

  try {
    const incoming = Array.isArray(body) ? body : [body];
    const nextCompras = incoming.map((item) => {
      const record = (item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : {}) as Record<string, unknown>;
      validateCompraRelations(record, tenant.companyId, db);
      return sanitizeCompraRecord(record, tenant.companyId);
    });

    const finalCompras = Array.isArray(body) ? nextCompras : [...currentTenantCompras, ...nextCompras];
    writeDb({ ...db, compras: finalCompras });
    return NextResponse.json({ ok: true, data: finalCompras });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "No se pudo guardar la compra." }, { status: 403 });
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
  const compras = Array.isArray(db.compras) ? db.compras : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id de la compra." }, { status: 400 });
  }

  const currentIndex = compras.findIndex((compra) => String((compra as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Compra no encontrada." }, { status: 404 });
  }

  if (!tenantRecordAccess(compras[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para modificar esta compra." }, { status: 403 });
  }

  try {
    const updated = sanitizeCompraRecord({ ...(compras[currentIndex] as Record<string, unknown>), ...(body as Record<string, unknown>), id }, tenant.companyId);
    validateCompraRelations(updated, tenant.companyId, db);
    const nextCompras = [...compras];
    nextCompras[currentIndex] = updated;
    writeDb({ ...db, compras: nextCompras });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "No se pudo actualizar la compra." }, { status: 403 });
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
  const compras = Array.isArray(db.compras) ? db.compras : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id de la compra." }, { status: 400 });
  }

  const currentIndex = compras.findIndex((compra) => String((compra as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Compra no encontrada." }, { status: 404 });
  }

  if (!tenantRecordAccess(compras[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para eliminar esta compra." }, { status: 403 });
  }

  const nextCompras = compras.filter((compra) => String((compra as Record<string, unknown>).id ?? "") !== id);
  writeDb({ ...db, compras: nextCompras });
  return NextResponse.json({ ok: true, deletedId: id });
}
