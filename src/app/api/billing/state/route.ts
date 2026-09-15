import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readDb } from "@/lib/db";
import { getSubscriptionState, requireAuth } from "@/lib/saas-auth";

export async function GET() {
  const token = (await cookies()).get("stockflow_session")?.value ?? null;
  const auth = requireAuth({ sessionToken: token });

  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: 401 });
  }

  const db = readDb();
  const companyId = auth.companyId ?? null;
  const company = (Array.isArray(db.companies) ? db.companies : []).find((entry) => String((entry as { id?: string }).id ?? "") === companyId) as { id?: string; nombre?: string; status?: string } | undefined;
  const subscription = (Array.isArray(db.subscriptions) ? db.subscriptions : []).find((entry) => String((entry as { companyId?: string | null }).companyId ?? "") === companyId) as {
    id?: string;
    companyId?: string | null;
    status?: string;
    productId?: string;
    planId?: string;
    trialStartAt?: string | null;
    trialEndAt?: string | null;
    startedAt?: string | null;
    priceAmount?: number;
    currency?: string;
  } | undefined;

  const plan = (Array.isArray(db.plans) ? db.plans : []).find((entry) => String((entry as { id?: string }).id ?? "") === subscription?.planId) as {
    id?: string;
    code?: string;
    name?: string;
    amount?: number;
    currency?: string;
  } | undefined;

  const state = getSubscriptionState(companyId);

  return NextResponse.json({
    ok: true,
    data: {
      user: { id: auth.user.id, nombre: auth.user.nombre, email: auth.user.email },
      company: { id: company?.id ?? companyId, nombre: company?.nombre ?? "Mi empresa", status: company?.status ?? "trial" },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status ?? state.status,
        productId: subscription.productId ?? null,
        planId: subscription.planId ?? null,
        trialStartAt: subscription.trialStartAt ?? state.trialStartAt,
        trialEndAt: subscription.trialEndAt ?? state.trialEndAt,
        startedAt: subscription.startedAt ?? state.startedAt,
        priceAmount: subscription.priceAmount ?? 0,
        currency: subscription.currency ?? "ARS",
      } : null,
      plan: plan ? { id: plan.id, code: plan.code, name: plan.name, amount: plan.amount, currency: plan.currency } : { code: "standard", name: "Standard", amount: 0, currency: "ARS" },
      state: {
        status: state.status,
        trialStartAt: state.trialStartAt,
        trialEndAt: state.trialEndAt,
        startedAt: state.startedAt,
        daysRemaining: state.daysRemaining,
        isBlocked: state.isBlocked,
        canAccessBilling: state.canAccessBilling,
        canUseProduct: state.canUseProduct,
      },
    },
  });
}
