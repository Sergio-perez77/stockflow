import { getUsers, normalizeUser, type SessionUser } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

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
  const paymentMethodStatus =
    typeof record.paymentMethodStatus === "string"
      ? record.paymentMethodStatus
      : user.paymentMethodStatus ?? "not_added";
  const paymentProvider =
    typeof record.paymentProvider === "string"
      ? record.paymentProvider
      : user.paymentProvider ?? null;

  return {
    ...user,
    company: String(record.company ?? user.company ?? "").trim() || undefined,
    product: (user.product ?? "stockflow") as OwnerUserRecord["product"],
    plan: (user.plan ?? "standard") as OwnerUserRecord["plan"],
    subscriptionStatus: (user.subscriptionStatus ?? "active") as OwnerUserRecord["subscriptionStatus"],
    trialEnabled: Boolean(user.trialEnabled ?? false),
    trialStartedAt,
    trialEndsAt,
    paymentMethodStatus: (paymentMethodStatus as OwnerUserRecord["paymentMethodStatus"]) ?? "not_added",
    paymentProvider: (paymentProvider as "mercadopago" | "stripe" | null) ?? null,
    paymentCustomerId: typeof record.paymentCustomerId === "string" ? record.paymentCustomerId : user.paymentCustomerId ?? null,
    paymentMethodId: typeof record.paymentMethodId === "string" ? record.paymentMethodId : user.paymentMethodId ?? null,
    autoRenew: Boolean(record.autoRenew ?? user.autoRenew ?? false),
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

export function persistOwnerUsers(nextUsers: OwnerUserRecord[]) {
  const normalizedUsers = nextUsers.map((user) => normalizeOwnerUser(user));
  const db = readDb();
  writeDb({
    ...db,
    users: normalizedUsers,
  });

  return normalizedUsers;
}

export function getOwnerUserById(userId: string) {
  return getOwnerUsers().find((user) => user.id === userId) ?? null;
}

export function updateOwnerUser(
  userId: string,
  patch: Partial<OwnerUserRecord>
): OwnerUserRecord | null {
  const users = getOwnerUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return null;
  }

  const current = users[index];
  const nextUser = normalizeOwnerUser({
    ...current,
    ...patch,
  });

  const nextUsers = users.map((user) => (user.id === userId ? nextUser : user));
  persistOwnerUsers(nextUsers);

  return nextUser;
}

export function getOwnerOverview(users: OwnerUserRecord[] = getOwnerUsers()) {
  const regularUsers = users.filter((user) => user.role !== "owner");

  const activeUsers = regularUsers.filter((user) => user.subscriptionStatus === "active").length;
  const inTrialUsers = regularUsers.filter((user) => user.trialEnabled || user.subscriptionStatus === "trial").length;
  const expiredTrials = regularUsers.filter((user) => user.subscriptionStatus === "expired").length;
  const stockflowUsers = regularUsers.filter((user) => user.product === "stockflow").length;
  const stockflowPlusUsers = regularUsers.filter((user) => user.product === "stockflow_plus").length;
  const plusUsers = regularUsers.filter((user) => user.plan === "plus").length;
  const trialsExpiringSoon = regularUsers.filter((user) => {
    if (!user.trialEnabled && user.subscriptionStatus !== "trial") return false;
    const summary = getTrialSummary(user);
    return summary.remainingDays > 0 && summary.remainingDays <= 7;
  }).length;

  return {
    totalUsers: regularUsers.length,
    activeUsers,
    inTrialUsers,
    expiredTrials,
    stockflowUsers,
    stockflowPlusUsers,
    plusUsers,
    trialsExpiringSoon,
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
    const isExpired = now.getTime() > end.getTime() || (!user.trialEnabled && user.subscriptionStatus === "expired");

    return {
      startDate: start?.toISOString().slice(0, 10) ?? null,
      endDate: end?.toISOString().slice(0, 10) ?? null,
      elapsedDays,
      remainingDays,
      isExpired,
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

export function applyOwnerTrialAction(
  user: OwnerUserRecord,
  action: "activate_trial" | "deactivate_trial" | "add_days" | "remove_days" | "reset_trial",
  days = 0
): OwnerUserRecord {
  const normalizedUser = normalizeOwnerUser(user);
  const start = normalizedUser.trialStartedAt ? new Date(`${normalizedUser.trialStartedAt}T00:00:00Z`) : new Date();
  const end = normalizedUser.trialEndsAt ? new Date(`${normalizedUser.trialEndsAt}T00:00:00Z`) : new Date(start);

  switch (action) {
    case "activate_trial": {
      const nextStart = new Date();
      nextStart.setHours(0, 0, 0, 0);
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextEnd.getDate() + 30);

      return normalizeOwnerUser({
        ...normalizedUser,
        product: "stockflow",
        plan: "free_trial",
        subscriptionStatus: "trial",
        trialEnabled: true,
        trialStartedAt: nextStart.toISOString().slice(0, 10),
        trialEndsAt: nextEnd.toISOString().slice(0, 10),
      });
    }
    case "deactivate_trial": {
      return normalizeOwnerUser({
        ...normalizedUser,
        subscriptionStatus: "expired",
        trialEnabled: false,
      });
    }
    case "add_days": {
      const nextEnd = new Date(end);
      nextEnd.setDate(nextEnd.getDate() + Math.max(0, Number(days) || 0));
      return normalizeOwnerUser({
        ...normalizedUser,
        subscriptionStatus: "trial",
        trialEnabled: true,
        trialStartedAt: normalizedUser.trialStartedAt ?? start.toISOString().slice(0, 10),
        trialEndsAt: nextEnd.toISOString().slice(0, 10),
      });
    }
    case "remove_days": {
      const nextEnd = new Date(end);
      nextEnd.setDate(nextEnd.getDate() - Math.max(0, Number(days) || 0));
      return normalizeOwnerUser({
        ...normalizedUser,
        subscriptionStatus: "trial",
        trialEnabled: true,
        trialStartedAt: normalizedUser.trialStartedAt ?? start.toISOString().slice(0, 10),
        trialEndsAt: nextEnd.toISOString().slice(0, 10),
      });
    }
    case "reset_trial": {
      const nextStart = new Date();
      nextStart.setHours(0, 0, 0, 0);
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextEnd.getDate() + 30);
      return normalizeOwnerUser({
        ...normalizedUser,
        product: "stockflow",
        plan: "free_trial",
        subscriptionStatus: "trial",
        trialEnabled: true,
        trialStartedAt: nextStart.toISOString().slice(0, 10),
        trialEndsAt: nextEnd.toISOString().slice(0, 10),
      });
    }
    default:
      return normalizedUser;
  }
}

export function setTrialWindow(user: OwnerUserRecord, startedAt = new Date()) {
  const normalizedUser = normalizeOwnerUser(user);
  const nextStart = new Date(startedAt);
  nextStart.setHours(0, 0, 0, 0);

  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 30);

  return {
    ...normalizedUser,
    plan: "free_trial",
    product: "stockflow",
    subscriptionStatus: "trial",
    trialEnabled: true,
    trialStartedAt: nextStart.toISOString().slice(0, 10),
    trialEndsAt: nextEnd.toISOString().slice(0, 10),
  } satisfies OwnerUserRecord;
}

export function addTrialDays(user: OwnerUserRecord, days: number) {
  const normalizedUser = normalizeOwnerUser(user);
  const currentEnd = normalizedUser.trialEndsAt ? new Date(`${normalizedUser.trialEndsAt}T00:00:00Z`) : null;
  const nextEnd = currentEnd ? new Date(currentEnd) : new Date();
  nextEnd.setDate(nextEnd.getDate() + Math.max(0, Number(days) || 0));

  return {
    ...normalizedUser,
    subscriptionStatus: "trial",
    trialEnabled: true,
    trialEndsAt: nextEnd.toISOString().slice(0, 10),
  } satisfies OwnerUserRecord;
}

export function getPlusUsers(users: OwnerUserRecord[] = getOwnerUsers()) {
  return users.filter((user) => user.role !== "owner" && user.product === "stockflow_plus");
}

export function getPromotionSummary(users: OwnerUserRecord[] = getOwnerUsers()) {
  const internalRoles = new Set(["owner", "admin", "gerente"]);
  const regularUsers = users
    .filter((user) => !internalRoles.has(user.role))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return aTime - bTime || String(a.id).localeCompare(String(b.id));
    });

  const first100Used = regularUsers.slice(0, 100).length;
  const second100Used = regularUsers.slice(100, 200).length;

  return {
    first100Used,
    first100Remaining: Math.max(0, 100 - first100Used),
    second100Used,
    second100Remaining: Math.max(0, 100 - second100Used),
    totalEligibleUsers: regularUsers.length,
    promoForUserIndex(index: number) {
      if (index < 0 || index >= 200) return "outside";
      if (index < 100) return "first-100";
      return "next-100";
    },
    usersByPromotion: regularUsers,
  };
}
