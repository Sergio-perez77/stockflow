import { NextResponse } from "next/server";

import { readDb, replaceCollectionData, writeDb } from "@/lib/db";

export async function GET() {
  const db = readDb();

  return NextResponse.json({ ok: true, data: db.proveedores });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const db = readDb();

  const nextProveedores = Array.isArray(payload) ? payload : [payload];
  const nextDb = replaceCollectionData(db, "proveedores", nextProveedores);

  writeDb(nextDb);

  return NextResponse.json({ ok: true, data: nextDb.proveedores });
}
