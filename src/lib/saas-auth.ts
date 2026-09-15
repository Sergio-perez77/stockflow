import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

import { readDb, writeDb } from "./db";
import {
  createAuditLogRecord,
  createBillingEventRecord,
  createCompanyRecord,
  createDefaultBillingSeed,
  createSessionRecord,
  createSubscriptionRecord,
  createUserCompanyRecord,
  generateId,
} from "./saas";
import type {
  CompanyRecord,
  SessionRecord,
  SubscriptionRecord,
  UserCompanyRole,
} from "./saas-types";

export type SessionUserLike = {
  id: string;
  email: string;
  nombre: string;
  role?: string;
  globalRole?: string;
  companyId?: string | null;
  company?: string;
  password?: string;
};

export type CreateCompanyResult = {
  ok: true;
  user: SessionUserLike;
  company: CompanyRecord;
  userCompany: UserCompanyRole;
  subscription: SubscriptionRecord;
  billingEvent: ReturnType<typeof createBillingEventRecord>;
  auditLog: ReturnType<typeof createAuditLogRecord>;
};

export type SubscriptionState = {
  status: SubscriptionRecord["status"] | "none";
  trialStartAt: string | null;
  trialEndAt: string | null;
  startedAt: string | null;
  isTrial: boolean;
  isActive: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isCanceled: boolean;
  isPastDue: boolean;
  canAccessBilling: boolean;
  canUseProduct: boolean;
  isBlocked: boolean;
  daysRemaining: number;
};

export function hashPassword(password: string): string {
  return bcrypt.hashSync(String(password ?? ""), 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  const source = String(password ?? "");
  const target = String(hash ?? "");

  if (!source || !target) {
    return false;
  }

  if (target.startsWith("$2a$") || target.startsWith("$2b$") || target.startsWith("$2y$")) {
    return bcrypt.compareSync(source, target);
  }

  return false;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(String(token ?? "")).digest("hex");
}

export function issueSessionToken(userId: string): string {
  return `${userId}:${randomBytes(32).toString("hex")}`;
}

function getSessionByHash(tokenHash: string): SessionRecord | null {
  const db = readDb();
  const sessions = Array.isArray(db.sessions) ? db.sessions : [];

  const match = sessions.find((session): session is SessionRecord => {
    const candidate = session as Partial<SessionRecord>;
    return typeof candidate.sessionTokenHash === "string"
      && candidate.sessionTokenHash === tokenHash
      && !candidate.revokedAt;
  });

  return match ?? null;
}

export function createSessionForUser(
  userId: string,
  input: { token: string; companyId?: string | null; userAgent?: string | null; ipAddress?: string | null }
): SessionRecord {
  const db = readDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const record = createSessionRecord({
    userId,
    companyId: input.companyId ?? null,
    sessionTokenHash: hashSessionToken(input.token),
    expiresAt,
    userAgent: input.userAgent ?? null,
    ipAddress: input.ipAddress ?? null,
    createdAt: now,
    lastSeenAt: now,
  });

  const nextSessions = [...(Array.isArray(db.sessions) ? db.sessions : []), record];
  writeDb({ ...db, sessions: nextSessions });

  return record;
}

export function verifySessionToken(token: string, expectedHash: string): boolean {
  if (!token || !expectedHash) return false;

  const computedHash = hashSessionToken(token);
  if (computedHash !== expectedHash) {
    return false;
  }

  const db = readDb();
  const sessions = Array.isArray(db.sessions) ? db.sessions : [];

  return sessions.some((session) => {
    const candidate = session as SessionRecord;
    return candidate.sessionTokenHash === expectedHash && !candidate.revokedAt;
  });
}

export function revokeSession(token: string): boolean {
  const db = readDb();
  const sessions = Array.isArray(db.sessions) ? db.sessions : [];
  const nextSessions = sessions.map((session) => {
    const candidate = session as SessionRecord;
    if (candidate.sessionTokenHash === hashSessionToken(token)) {
      return { ...candidate, revokedAt: new Date().toISOString() };
    }
    return candidate;
  });

  writeDb({ ...db, sessions: nextSessions });
  return nextSessions.some((session) => {
    const candidate = session as SessionRecord;
    return candidate.sessionTokenHash === hashSessionToken(token) && Boolean(candidate.revokedAt);
  });
}

export function getCompanySubscription(companyId: string | null | undefined): SubscriptionRecord | null {
  if (!companyId) return null;

  const db = readDb();
  const subscriptions = Array.isArray(db.subscriptions) ? db.subscriptions : [];
  const match = subscriptions.find((entry) => String((entry as { companyId?: string | null }).companyId ?? "") === String(companyId));

  return match ? (match as SubscriptionRecord) : null;
}

export function getSubscriptionState(companyId: string | null | undefined): SubscriptionState {
  const subscription = getCompanySubscription(companyId);
  const status = subscription?.status ?? "none";

  const toDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const trialStartAt = subscription?.trialStartAt ?? null;
  const trialEndAt = subscription?.trialEndAt ?? null;
  const startedAt = subscription?.startedAt ?? null;
  const trialStartDate = toDate(trialStartAt);
  const trialEndDate = toDate(trialEndAt);
  const now = new Date();
  const daysRemaining = trialEndDate && trialEndDate.getTime() > now.getTime()
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const state: SubscriptionState = {
    status: status as SubscriptionState["status"],
    trialStartAt,
    trialEndAt,
    startedAt,
    isTrial: status === "trial",
    isActive: status === "active",
    isExpired: status === "expired",
    isSuspended: status === "suspended",
    isCanceled: status === "canceled",
    isPastDue: status === "past_due",
    canAccessBilling: status !== "none" && status !== "canceled",
    canUseProduct: status === "trial" || status === "active",
    isBlocked: status === "expired" || status === "suspended" || status === "canceled",
    daysRemaining,
  };

  if (status === "none" && trialStartDate && trialEndDate) {
    state.canAccessBilling = true;
    state.canUseProduct = false;
    state.isBlocked = true;
  }

  return state;
}

export function createCompanyWithOwner(input: {
  nombre: string;
  email: string;
  password: string;
  nombrePersona?: string;
  slug?: string;
  currency?: string;
}): CreateCompanyResult {
  const db = readDb();
  const users = Array.isArray(db.users) ? db.users : [];
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const nombre = String(input.nombre ?? "").trim();

  if (!email || !password || !nombre) {
    throw new Error("Nombre, email y contraseña son requeridos.");
  }

  const emailExists = users.some((user) => String((user as { email?: string }).email ?? "").toLowerCase() === email);
  if (emailExists) {
    throw new Error("Ya existe un usuario con ese email.");
  }

  const userId = generateId("user");
  const company = createCompanyRecord({
    nombre,
    slug: input.slug ?? `${nombre.toLowerCase().replace(/\s+/g, "-")}-tenant`,
    currency: input.currency ?? "ARS",
    status: "trial",
  });

  const user: SessionUserLike = {
    id: userId,
    nombre: input.nombrePersona || nombre,
    email,
    password: hashPassword(password),
    role: "owner",
    company: company.nombre,
    companyId: company.id,
  };

  const dbUser = {
    ...user,
    createdAt: new Date().toISOString(),
    company: company.nombre,
    companyId: company.id,
    password: hashPassword(password),
    role: "owner",
  };

  const userCompany = createUserCompanyRecord({
    userId: user.id,
    companyId: company.id,
    role: "owner",
    isOwner: true,
  });

  let productId = "stockflow-product";
  let planId = "stockflow-standard";
  const now = new Date();
  const trialStartAt = new Date(now);
  const trialEndAt = new Date(now);
  trialEndAt.setDate(trialEndAt.getDate() + 30);

  const existingBillingProducts = Array.isArray(db.billingProducts) ? db.billingProducts : [];
  if (existingBillingProducts.length === 0) {
    const defaultSeed = createDefaultBillingSeed();
    if (Array.isArray(defaultSeed.billingProducts) && defaultSeed.billingProducts.length > 0) {
      const defaultProduct = defaultSeed.billingProducts[0] as { id?: string };
      const defaultPlan = Array.isArray(defaultSeed.plans) ? defaultSeed.plans[0] as { id?: string } : null;
      if (defaultProduct?.id) {
        productId = defaultProduct.id;
      }
      if (defaultPlan?.id) {
        planId = defaultPlan.id;
      }
    }
  }

  const subscription = createSubscriptionRecord({
    companyId: company.id,
    productId,
    planId,
    status: "trial",
    trialStartAt: trialStartAt.toISOString(),
    trialEndAt: trialEndAt.toISOString(),
    startedAt: trialStartAt.toISOString(),
    nextBillingAt: trialEndAt.toISOString(),
    autoRenew: true,
    provider: "manual",
    priceAmount: 0,
    currency: company.currency,
  });

  const billingEvent = createBillingEventRecord({
    companyId: company.id,
    subscriptionId: subscription.id,
    eventType: "trial_started",
    occurredAt: new Date().toISOString(),
    actorUserId: user.id,
    payload: { trialStartAt: subscription.trialStartAt, trialEndAt: subscription.trialEndAt },
  });

  const auditLog = createAuditLogRecord({
    entityType: "company",
    entityId: company.id,
    action: "company_created",
    actorUserId: user.id,
    actorCompanyId: company.id,
    metadata: { ownerEmail: email },
  });

  const nextDb = {
    ...db,
    users: [...users, dbUser],
    companies: [...(Array.isArray(db.companies) ? db.companies : []), company],
    userCompanies: [...(Array.isArray(db.userCompanies) ? db.userCompanies : []), userCompany],
    subscriptions: [...(Array.isArray(db.subscriptions) ? db.subscriptions : []), subscription],
    billingEvents: [...(Array.isArray(db.billingEvents) ? db.billingEvents : []), billingEvent],
    auditLogs: [...(Array.isArray(db.auditLogs) ? db.auditLogs : []), auditLog],
  };

  const seededBilling = createDefaultBillingSeed();
  const nextDbWithBilling = {
    ...nextDb,
    billingProducts: Array.isArray(seededBilling.billingProducts) ? seededBilling.billingProducts : nextDb.billingProducts,
    plans: Array.isArray(seededBilling.plans) ? seededBilling.plans : nextDb.plans,
  };

  writeDb(nextDbWithBilling);

  return {
    ok: true,
    user,
    company,
    userCompany,
    subscription,
    billingEvent,
    auditLog,
  };
}

export function getUserByEmail(email: string): SessionUserLike | null {
  const db = readDb();
  const users = Array.isArray(db.users) ? db.users : [];
  const normalized = String(email ?? "").trim().toLowerCase();

  return (
    (users.find((user) => String((user as { email?: string }).email ?? "").trim().toLowerCase() === normalized) as SessionUserLike | undefined) ?? null
  );
}

export function tenantRecordAccess(
  record: Partial<{ companyId?: string | null }> | null | undefined,
  companyId: string | null | undefined,
): boolean {
  if (!companyId) return false;
  if (!record) return false;
  const recordCompanyId = String(record.companyId ?? "").trim();
  return Boolean(recordCompanyId) && recordCompanyId === companyId;
}

export function filterTenantRecords<T extends { companyId?: string | null }>(
  records: T[],
  companyId: string | null | undefined,
): T[] {
  if (!companyId) return [];
  return records.filter((record) => tenantRecordAccess(record, companyId));
}

export function requireAuth(input: {
  sessionToken?: string | null;
  sessionRecord?: SessionRecord | null;
}): { ok: true; user: SessionUserLike; sessionRecord: SessionRecord | null; companyId: string | null } | { ok: false; message: string } {
  const token = String(input.sessionToken ?? "").trim();
  const sessionRecord = input.sessionRecord ?? (token ? getSessionByHash(hashSessionToken(token)) : null);

  if (!token || !sessionRecord) {
    return { ok: false, message: "Debe iniciar sesión para continuar." };
  }

  if (sessionRecord.revokedAt) {
    return { ok: false, message: "La sesión fue revocada." };
  }

  const user = getUserByEmail(
    String((readDb().users as Array<Record<string, unknown>> | undefined)?.find((entry) => String(entry.id ?? "") === sessionRecord.userId)?.email ?? "")
  );

  if (!user) {
    return { ok: false, message: "No se encontró el usuario de la sesión." };
  }

  return {
    ok: true,
    user,
    sessionRecord,
    companyId: sessionRecord.companyId ?? null,
  };
}

export function requireTenant(input: {
  user?: SessionUserLike | null | undefined;
  companyId?: string | null;
  sessionToken?: string | null;
  sessionRecord?: SessionRecord | null;
}): { ok: true; user: SessionUserLike; companyId: string; company: CompanyRecord | null; sessionRecord: SessionRecord | null } | { ok: false; message: string } {
  const auth = requireAuth({ sessionToken: input.sessionToken, sessionRecord: input.sessionRecord });
  if (!auth.ok) {
    return auth;
  }

  const requestedCompanyId = String(input.companyId ?? auth.companyId ?? "").trim();
  const expectedCompanyId = String(auth.companyId ?? "").trim();
  const companyId = expectedCompanyId || requestedCompanyId;

  if (!companyId) {
    return { ok: false, message: "No se encontró una empresa asociada a la sesión." };
  }

  if (requestedCompanyId && requestedCompanyId !== companyId) {
    return { ok: false, message: "La empresa solicitada no coincide con la sesión autenticada." };
  }

  const db = readDb();
  const company = (Array.isArray(db.companies) ? db.companies : []).find((entry) => String((entry as CompanyRecord).id ?? "") === companyId) as CompanyRecord | undefined;

  if (!company) {
    return { ok: false, message: "La empresa asociada a la sesión no existe." };
  }

  return {
    ok: true,
    user: auth.user,
    companyId,
    company,
    sessionRecord: auth.sessionRecord,
  };
}

export function requireSubscription(input: {
  sessionToken?: string | null;
  sessionRecord?: SessionRecord | null;
  companyId?: string | null;
}): { ok: true; companyId: string; company: CompanyRecord | null; sessionRecord: SessionRecord | null } | { ok: false; message: string } {
  const tenant = requireTenant({
    sessionToken: input.sessionToken,
    sessionRecord: input.sessionRecord,
    companyId: input.companyId,
  });

  if (!tenant.ok) {
    return tenant;
  }

  const db = readDb();
  const companyId = tenant.companyId;
  const state = getSubscriptionState(companyId);
  if (!state.canUseProduct) {
    return { ok: false, message: state.status === "expired" ? "La prueba venció. Debés regularizar la suscripción para continuar." : "La suscripción actual no permite usar el producto." };
  }

  return { ok: true, companyId, company: tenant.company, sessionRecord: tenant.sessionRecord };
}

export function requireOwner(input: {
  user: SessionUserLike | null | undefined;
  companyId?: string | null;
}): { ok: true; user: SessionUserLike; companyId?: string | null } | { ok: false; message: string } {
  const user = input.user;
  if (!user) {
    return { ok: false, message: "Debe iniciar sesión como usuario válido." };
  }

  const globalRole = String(user.globalRole ?? "").trim();

  if (globalRole === "platform_admin" || globalRole === "stockflow_owner") {
    return { ok: true, user, companyId: input.companyId ?? user.companyId ?? null };
  }

  return { ok: false, message: "El usuario no tiene permisos de owner de plataforma." };
}

export function createTenantAwareApiContext(input: {
  sessionToken?: string | null;
  requestCompanyId?: string | null;
  sessionRecord?: SessionRecord | null;
  user: SessionUserLike | null | undefined;
}): { ok: true; user: SessionUserLike; companyId: string; sessionRecord: SessionRecord | null } | { ok: false; message: string } {
  const auth = requireAuth({ sessionToken: input.sessionToken, sessionRecord: input.sessionRecord });
  if (!auth.ok) {
    return auth;
  }

  const effectiveCompanyId = String(auth.companyId ?? input.requestCompanyId ?? "").trim();
  if (!effectiveCompanyId) {
    return { ok: false, message: "No hay empresa activa para este usuario." };
  }

  const sessionCompanyId = String(auth.companyId ?? "").trim();
  if (input.requestCompanyId && input.requestCompanyId !== sessionCompanyId && sessionCompanyId) {
    return { ok: true, user: auth.user, companyId: sessionCompanyId, sessionRecord: auth.sessionRecord };
  }

  return { ok: true, user: auth.user, companyId: effectiveCompanyId, sessionRecord: auth.sessionRecord };
}

export function getSessionCompanyId(sessionToken: string): string | null {
  const db = readDb();
  const normalizedToken = String(sessionToken ?? "").trim();
  if (!normalizedToken) return null;

  const session = (Array.isArray(db.sessions) ? db.sessions : []).find((entry) => {
    const candidate = entry as SessionRecord;
    return candidate.sessionTokenHash === hashSessionToken(normalizedToken) && !candidate.revokedAt;
  }) as SessionRecord | undefined;

  return session?.companyId ?? null;
}
