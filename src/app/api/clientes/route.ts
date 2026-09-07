import { NextResponse } from "next/server";

import { readDb, replaceCollectionData, writeDb } from "@/lib/db";

export async function GET() {
  const db = readDb();

  return NextResponse.json({ ok: true, data: db.clientes });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const db = readDb();

  const nextClientes = Array.isArray(payload) ? payload : [payload];
  const nextDb = replaceCollectionData(db, "clientes", nextClientes);

  writeDb(nextDb);

  return NextResponse.json({ ok: true, data: nextDb.clientes });
}
