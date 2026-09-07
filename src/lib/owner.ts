import { getUsers, normalizeUser, type SessionUser } from "@/lib/auth";
import { readDb } from "@/lib/db";

export type OwnerUserRecord = SessionUser & {
  company?: string;
  product: "stockflow" | "stockflow_plus";
  plan: SessionUser["plan"] | "free_trial" | "standard" | "plus";
  subscriptionStatus: "trial" | "active" | "expired" | "suspended";
  trialEnabled: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  discountPercent: number;
  promotionId: string | null;
  createdAt: string;
};

export function normalizeOwnerUser(input: Partial<SessionUser> | Record<string, unknown>): OwnerUserRecord {
  const user = normalizeUser(input as Partial<SessionUser>);
  const record = input as Record<string, unknown>;

  const trialStartedAt =
    typeof input?.trialStartedAt === "string" ? input.trialStartedAt : user.trialStartedAt ?? null;
  const trialEndsAt =
    typeof input?.trialEndsAt === "string" ? input.trialEndsAt : user.trialEndsAt ?? null;
  const promotionId: string | null =
    typeof record.promotionId === "string"
      ? record.promotionId
      : typeof user.promotionId === "string"
        ? user.promotionId
        : null;

  return {
    ...user,
    company: String(record.company ?? user.company ?? "").trim() || undefined,
    product: (user.product ?? "stockflow") as OwnerUserRecord["product"],
    plan: (user.plan ?? "standard") as OwnerUserRecord["plan"],
    subscriptionStatus: (user.subscriptionStatus ?? "active") as OwnerUserRecord["subscriptionStatus"],
    trialEnabled: Boolean(user.trialEnabled ?? false),
    trialStartedAt,
    trialEndsAt,
    discountPercent: Number.isFinite(Number(record.discountPercent ?? 0))
      ? Number(record.discountPercent ?? 0)
      : 0,
    promotionId,
    createdAt: String(record.createdAt ?? user.createdAt ?? new Date().toISOString().slice(0, 10)),
  };
}

export function getOwnerUsers(): OwnerUserRecord[] {
  if (typeof window !== "undefined") {
    return getUsers().map((user) => normalizeOwnerUser(user));
  }

  const db = readDb();
  const users = Array.isArray(db.users) ? db.users : [];

  return users
    .map((user) => normalizeOwnerUser(user as Record<string, unknown>))
    .filter((user) => user.email && user.nombre);
}

export function getOwnerOverview(users: OwnerUserRecord[] = getOwnerUsers()) {
  const regularUsers = users.filter((user) => user.role !== "owner");

  const activeUsers = regularUsers.filter((user) => user.subscriptionStatus === "active").length;
  const inTrialUsers = regularUsers.filter((user) => user.trialEnabled || user.subscriptionStatus === "trial").length;
  const expiredTrials = regularUsers.filter((user) => user.subscriptionStatus === "expired").length;
  const stockflowUsers = regularUsers.filter((user) => user.product === "stockflow").length;
  const stockflowPlusUsers = regularUsers.filter((user) => user.product === "stockflow_plus").length;
  const plusUsers = regularUsers.filter((user) => user.plan === "plus").length;

  return {
    totalUsers: regularUsers.length,
    activeUsers,
    inTrialUsers,
    expiredTrials,
    stockflowUsers,
    stockflowPlusUsers,
    plusUsers,
  };
}

export function getTrialSummary(user: OwnerUserRecord) {
  const start = user.trialStartedAt ? new Date(`${user.trialStartedAt}T00:00:00Z`) : null;
  const end = user.trialEndsAt ? new Date(`${user.trialEndsAt}T00:00:00Z`) : null;
  const now = new Date();

  const elapsedDays = start
    ? Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000))
    : 0;

  if (end) {
    const remainingMs = end.getTime() - now.getTime();
    const remainingDays = remainingMs <= 0 ? 0 : Math.ceil(remainingMs / 86400000);

    return {
      startDate: start?.toISOString().slice(0, 10) ?? null,
      endDate: end?.toISOString().slice(0, 10) ?? null,
      elapsedDays,
      remainingDays,
      isExpired: remainingDays === 0 && now.getTime() > end.getTime(),
    };
  }

  return {
    startDate: start?.toISOString().slice(0, 10) ?? null,
    endDate: null,
    elapsedDays,
    remainingDays: 0,
    isExpired: false,
  };
}
