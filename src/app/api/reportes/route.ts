import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb } from "@/lib/db";
import { requireTenant, tenantRecordAccess } from "@/lib/saas-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const tenant = requireTenant({ sessionToken: token });

  if (!tenant.ok) {
    return NextResponse.json({ ok: false, message: tenant.message }, { status: 401 });
  }

  const db = readDb();
  const products = Array.isArray(db.products) ? db.products : [];
  const clientes = Array.isArray(db.clientes) ? db.clientes : [];
  const proveedores = Array.isArray(db.proveedores) ? db.proveedores : [];
  const ventas = Array.isArray(db.ventas) ? db.ventas : [];
  const compras = Array.isArray(db.compras) ? db.compras : [];

  const companyProducts = products.filter((item) => tenantRecordAccess(item as { companyId?: string | null }, tenant.companyId));
  const companyClientes = clientes.filter((item) => tenantRecordAccess(item as { companyId?: string | null }, tenant.companyId));
  const companyProveedores = proveedores.filter((item) => tenantRecordAccess(item as { companyId?: string | null }, tenant.companyId));
  const companyVentas = ventas.filter((item) => tenantRecordAccess(item as { companyId?: string | null }, tenant.companyId));
  const companyCompras = compras.filter((item) => tenantRecordAccess(item as { companyId?: string | null }, tenant.companyId));

  const totalVentas = companyVentas.reduce<number>((sum, venta) => sum + Number((venta as Record<string, unknown>).total ?? 0), 0);
  const totalCompras = companyCompras.reduce<number>((sum, compra) => sum + Number((compra as Record<string, unknown>).costo ?? 0), 0);
  const stockTotal = companyProducts.reduce<number>((sum, producto) => sum + Number((producto as Record<string, unknown>).stock ?? 0), 0);

  return NextResponse.json({
    ok: true,
    data: {
      companyId: tenant.companyId,
      totals: {
        ventas: totalVentas,
        compras: totalCompras,
        clientes: companyClientes.length,
        proveedores: companyProveedores.length,
        productos: companyProducts.length,
        stock: stockTotal,
      },
      ventas: companyVentas,
      compras: companyCompras,
      clientes: companyClientes,
      proveedores: companyProveedores,
      productos: companyProducts,
    },
  });
}
