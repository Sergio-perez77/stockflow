import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb, writeDb } from "@/lib/db";
import { requireTenant, tenantRecordAccess } from "@/lib/saas-auth";

export const dynamic = "force-dynamic";

function sanitizeProductRecord(record: Record<string, unknown>, companyId: string) {
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
  const products = Array.isArray(db.products) ? db.products : [];
  const companyProducts = products.filter((product) => tenantRecordAccess(product as { companyId?: string | null }, tenant.companyId));

  return NextResponse.json({ ok: true, data: companyProducts });
}

export async function POST(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => []);
  const db = readDb();
  const products = Array.isArray(db.products) ? db.products : [];
  const currentTenantProducts = products.filter((product) => tenantRecordAccess(product as { companyId?: string | null }, tenant.companyId));

  const incoming = Array.isArray(body) ? body : [body];
  const nextProducts = incoming.map((item, index) => sanitizeProductRecord(
    (item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : {}) as Record<string, unknown>,
    tenant.companyId,
  ));

  const finalProducts = Array.isArray(body) ? nextProducts : [...currentTenantProducts, ...nextProducts];
  writeDb({ ...db, products: finalProducts });

  return NextResponse.json({ ok: true, data: finalProducts });
}

export async function PUT(request: Request) {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const db = readDb();
  const products = Array.isArray(db.products) ? db.products : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id del producto." }, { status: 400 });
  }

  const currentIndex = products.findIndex((product) => String((product as Record<string, unknown>).id ?? "") === id);
  if (currentIndex === -1) {
    return NextResponse.json({ ok: false, message: "Producto no encontrado." }, { status: 404 });
  }

  if (!tenantRecordAccess(products[currentIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para modificar este producto." }, { status: 403 });
  }

  const updated = sanitizeProductRecord({ ...(products[currentIndex] as Record<string, unknown>), ...(body as Record<string, unknown>), id }, tenant.companyId);
  const nextProducts = [...products];
  nextProducts[currentIndex] = updated;
  writeDb({ ...db, products: nextProducts });

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
  const products = Array.isArray(db.products) ? db.products : [];
  const id = String((body as Record<string, unknown> | null)?.id ?? "");

  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el id del producto." }, { status: 400 });
  }

  const matchIndex = products.findIndex((product) => String((product as Record<string, unknown>).id ?? "") === id);
  if (matchIndex === -1) {
    return NextResponse.json({ ok: false, message: "Producto no encontrado." }, { status: 404 });
  }

  if (!tenantRecordAccess(products[matchIndex] as { companyId?: string | null }, tenant.companyId)) {
    return NextResponse.json({ ok: false, message: "No tienes permisos para eliminar este producto." }, { status: 403 });
  }

  const nextProducts = products.filter((product) => String((product as Record<string, unknown>).id ?? "") !== id);
  writeDb({ ...db, products: nextProducts });

  return NextResponse.json({ ok: true, deletedId: id });
}
