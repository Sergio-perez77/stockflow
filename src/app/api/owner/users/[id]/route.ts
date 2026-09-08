import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSessionCookieValue, isOwnerRole } from "@/lib/auth";
import { applyOwnerTrialAction, getOwnerUserById, normalizeOwnerUser, updateOwnerUser } from "@/lib/owner";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("stockflow_session")?.value;
  const session = getSessionCookieValue(sessionCookie);

  if (!session || !isOwnerRole(session)) {
    return NextResponse.json(
      { ok: false, message: "Acceso no autorizado." },
      { status: 403 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const targetUser = getOwnerUserById(id);

  if (!targetUser) {
    return NextResponse.json(
      { ok: false, message: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  if (targetUser.role === "owner") {
    return NextResponse.json(
      { ok: false, message: "El usuario Owner no puede modificarse desde esta pantalla." },
      { status: 403 }
    );
  }

  let nextUser = normalizeOwnerUser({ ...targetUser, ...payload });

  if (payload.action === "activate_trial" || payload.action === "deactivate_trial" || payload.action === "add_days" || payload.action === "remove_days" || payload.action === "reset_trial") {
    nextUser = applyOwnerTrialAction(
      targetUser,
      payload.action,
      Number(payload.days ?? 0)
    );
  }

  if (typeof payload.product === "string") {
    nextUser = normalizeOwnerUser({ ...nextUser, product: payload.product });
  }

  if (typeof payload.plan === "string") {
    nextUser = normalizeOwnerUser({ ...nextUser, plan: payload.plan });
  }

  if (typeof payload.subscriptionStatus === "string") {
    nextUser = normalizeOwnerUser({ ...nextUser, subscriptionStatus: payload.subscriptionStatus });
  }

  if (typeof payload.paymentMethodStatus === "string") {
    nextUser = normalizeOwnerUser({ ...nextUser, paymentMethodStatus: payload.paymentMethodStatus });
  }

  if (typeof payload.paymentProvider === "string" || payload.paymentProvider === null) {
    nextUser = normalizeOwnerUser({ ...nextUser, paymentProvider: payload.paymentProvider });
  }

  if (typeof payload.paymentCustomerId === "string" || payload.paymentCustomerId === null) {
    nextUser = normalizeOwnerUser({ ...nextUser, paymentCustomerId: payload.paymentCustomerId });
  }

  if (typeof payload.paymentMethodId === "string" || payload.paymentMethodId === null) {
    nextUser = normalizeOwnerUser({ ...nextUser, paymentMethodId: payload.paymentMethodId });
  }

  if (typeof payload.autoRenew === "boolean") {
    nextUser = normalizeOwnerUser({ ...nextUser, autoRenew: payload.autoRenew });
  }

  if (typeof payload.discountPercent === "number") {
    nextUser = normalizeOwnerUser({ ...nextUser, discountPercent: payload.discountPercent });
  }

  if (typeof payload.promotionId === "string" || payload.promotionId === null) {
    nextUser = normalizeOwnerUser({ ...nextUser, promotionId: payload.promotionId });
  }

  const updated = updateOwnerUser(id, nextUser);

  return NextResponse.json({ ok: true, data: updated });
}
