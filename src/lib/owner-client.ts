import type { OwnerUserRecord } from "@/lib/owner";

export function getTrialSummaryForClient(user: OwnerUserRecord) {
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

export function getPromotionSummaryForClient(users: OwnerUserRecord[]) {
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
