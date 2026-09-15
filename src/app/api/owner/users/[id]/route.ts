import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb, writeDb } from "@/lib/db";
import { requireAuth, requireOwner } from "@/lib/saas-auth";
import { applyOwnerTrialAction, getOwnerUserById, normalizeOwnerUser, updateOwnerUser } from "@/lib/owner";
import { createAuditLogRecord, createBillingEventRecord } from "@/lib/saas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  if (updated) {
    const db = readDb();
    const action = (() => {
      if (payload.action === "activate_trial") return "trial_modified";
      if (payload.action === "deactivate_trial") return "trial_modified";
      if (payload.action === "reset_trial") return "trial_modified";
      if (payload.subscriptionStatus === "active") return "subscription_activated";
      if (payload.subscriptionStatus === "suspended") return "subscription_suspended";
      if (payload.subscriptionStatus === "canceled") return "subscription_canceled";
      if (typeof payload.plan === "string") return "plan_changed";
      return "trial_modified";
    })();

    const event = createBillingEventRecord({
      companyId: String(targetUser.company ?? auth.user.companyId ?? ""),
      subscriptionId: null,
      eventType: action,
      occurredAt: new Date().toISOString(),
      actorUserId: auth.user.id,
      payload: {
        targetUserId: id,
        targetEmail: updated.email,
        nextSubscriptionStatus: updated.subscriptionStatus,
        nextPlan: updated.plan,
        action: payload.action ?? payload.subscriptionStatus ?? payload.plan ?? "manual_update",
      },
    });

    const auditLog = createAuditLogRecord({
      entityType: "user",
      entityId: updated.id,
      action,
      actorUserId: auth.user.id,
      actorCompanyId: auth.user.companyId ?? null,
      metadata: {
        targetUserId: updated.id,
        targetEmail: updated.email,
        plan: updated.plan,
        status: updated.subscriptionStatus,
      },
    });

    writeDb({
      ...db,
      billingEvents: [...(Array.isArray(db.billingEvents) ? db.billingEvents : []), event],
      auditLogs: [...(Array.isArray(db.auditLogs) ? db.auditLogs : []), auditLog],
    });
  }

  return NextResponse.json({ ok: true, data: updated });
}
