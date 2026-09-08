import type { SessionUser } from "@/lib/auth";

export type OwnerUserRecord = SessionUser & {
  company?: string;
  product: "stockflow" | "stockflow_plus";
  plan: SessionUser["plan"] | "free_trial" | "standard" | "plus";
  subscriptionStatus: "trial" | "active" | "expired" | "suspended";
  trialEnabled: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  paymentMethodStatus: "not_added" | "ready" | "failed";
  paymentProvider: "mercadopago" | "stripe" | null;
  paymentCustomerId: string | null;
  paymentMethodId: string | null;
  autoRenew: boolean;
  discountPercent: number;
  promotionId: string | null;
  createdAt: string;
};
