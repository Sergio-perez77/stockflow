import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAuth, requireOwner } from "@/lib/saas-auth";
import { getOwnerUsers } from "@/lib/owner";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("stockflow_session")?.value ?? null;
  const auth = requireAuth({ sessionToken: token });

  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: 401 });
  }

  const owner = requireOwner({ user: auth.user });
  if (!owner.ok) {
    return NextResponse.json({ ok: false, message: owner.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true, data: getOwnerUsers() });
}
