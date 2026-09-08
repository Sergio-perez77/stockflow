import { normalizeUser, type SessionUser } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import type {
  AuditAction,
  AuditLogRecord,
  BillingCustomerRecord,
  BillingEventRecord,
  BillingProductRecord,
  CompanyRecord,
  CompanyRole,
  PaymentMethodReferenceRecord,
  PermissionRecord,
  PlanRecord,
  RolePermissionRecord,
  RoleRecord,
  SessionRecord,
  SubscriptionRecord,
  UserCompanyRole,
} from "@/lib/saas-types";

export const COMPANY_ROLES: CompanyRole[] = ["owner", "admin", "manager", "staff", "viewer"];
export const GLOBAL_ROLES = ["stockflow_owner", "support_admin", "platform_admin"] as const;
export const DEFAULT_PERMISSIONS = [
  "products.read",
  "products.write",
  "clientes.read",
  "clientes.write",
  "ventas.read",
  "ventas.write",
  "compras.read",
  "compras.write",
  "proveedores.read",
  "proveedores.write",
  "reportes.read",
  "configuracion.read",
  "configuracion.write",
  "billing.read",
  "billing.manage",
  "users.manage",
] as const;

export function slugify(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "tenant";
}

export function generateId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "getRandomValues" in crypto
    ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
    : Date.now().toString(36);

  return `${prefix}_${random}`;
}

export function createCompanyRecord(input: Partial<CompanyRecord> & { nombre: string }): CompanyRecord {
  const now = new Date().toISOString();
  const nombre = String(input.nombre ?? "").trim();
  const slug = input.slug ?? slugify(nombre);

  return {
    id: input.id ?? generateId("company"),
    nombre,
    slug,
    logoUrl: input.logoUrl ?? null,
    emailContacto: input.emailContacto ?? null,
    telefono: input.telefono ?? null,
    pais: input.pais ?? null,
    timezone: input.timezone ?? "UTC",
    currency: input.currency ?? "ARS",
    status: input.status ?? "trial",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function createUserCompanyRecord(input: Partial<UserCompanyRole> & {
  userId: string;
  companyId: string;
  role: CompanyRole;
  isOwner: boolean;
}): UserCompanyRole {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("user_company"),
    userId: input.userId,
    companyId: input.companyId,
    role: input.role,
    isOwner: Boolean(input.isOwner),
    invitedByUserId: input.invitedByUserId ?? null,
    acceptedAt: input.acceptedAt ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function createRoleRecord(input: Partial<RoleRecord>): RoleRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("role"),
    scope: input.scope ?? "company",
    name: input.name ?? "viewer",
    description: input.description ?? null,
    createdAt: input.createdAt ?? now,
  };
}

export function createPermissionRecord(input: Partial<PermissionRecord>): PermissionRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("permission"),
    key: input.key ?? "products.read",
    description: input.description ?? null,
    createdAt: input.createdAt ?? now,
  };
}

export function createRolePermissionRecord(input: Partial<RolePermissionRecord>): RolePermissionRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("role_permission"),
    roleName: input.roleName ?? "viewer",
    permissionKey: input.permissionKey ?? "products.read",
    createdAt: input.createdAt ?? now,
  };
}

export function createSessionRecord(input: Partial<SessionRecord> & {
  userId: string;
  sessionTokenHash: string;
  expiresAt: string;
}): SessionRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("session"),
    userId: input.userId,
    companyId: input.companyId ?? null,
    sessionTokenHash: input.sessionTokenHash,
    refreshTokenHash: input.refreshTokenHash ?? null,
    userAgent: input.userAgent ?? null,
    ipAddress: input.ipAddress ?? null,
    deviceId: input.deviceId ?? null,
    expiresAt: input.expiresAt,
    revokedAt: input.revokedAt ?? null,
    createdAt: input.createdAt ?? now,
    lastSeenAt: input.lastSeenAt ?? now,
  };
}

export function createBillingProductRecord(input: Partial<BillingProductRecord> & {
  code: string;
  name: string;
  slug: string;
}): BillingProductRecord {
  return {
    id: input.id ?? generateId("billing_product"),
    code: input.code,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    status: input.status ?? "active",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function createPlanRecord(input: Partial<PlanRecord> & {
  productId: string;
  code: string;
  name: string;
  amount: number;
  currency: string;
}): PlanRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("plan"),
    productId: input.productId,
    code: input.code,
    name: input.name,
    description: input.description ?? null,
    amount: Number(input.amount ?? 0),
    currency: input.currency ?? "ARS",
    billingInterval: input.billingInterval ?? "monthly",
    isActive: input.isActive ?? true,
    metadata: input.metadata ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function createSubscriptionRecord(input: Partial<SubscriptionRecord> & {
  companyId: string;
  productId: string;
  planId: string;
  status: SubscriptionRecord["status"];
  priceAmount: number;
  currency: string;
}): SubscriptionRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("subscription"),
    companyId: input.companyId,
    productId: input.productId,
    planId: input.planId,
    status: input.status,
    trialStartAt: input.trialStartAt ?? null,
    trialEndAt: input.trialEndAt ?? null,
    startedAt: input.startedAt ?? null,
    endedAt: input.endedAt ?? null,
    nextBillingAt: input.nextBillingAt ?? null,
    autoRenew: Boolean(input.autoRenew ?? true),
    cancelAt: input.cancelAt ?? null,
    cancelReason: input.cancelReason ?? null,
    externalSubscriptionId: input.externalSubscriptionId ?? null,
    provider: input.provider ?? "manual",
    priceAmount: Number(input.priceAmount ?? 0),
    currency: input.currency ?? "ARS",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function createBillingCustomerRecord(input: Partial<BillingCustomerRecord> & {
  companyId: string;
  provider: BillingCustomerRecord["provider"];
  externalCustomerId: string;
}): BillingCustomerRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("billing_customer"),
    companyId: input.companyId,
    provider: input.provider,
    externalCustomerId: input.externalCustomerId,
    status: input.status ?? "pending",
    defaultPaymentMethodId: input.defaultPaymentMethodId ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function createPaymentMethodReferenceRecord(input: Partial<PaymentMethodReferenceRecord> & {
  billingCustomerId: string;
  provider: PaymentMethodReferenceRecord["provider"];
  externalMethodId: string;
}): PaymentMethodReferenceRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("payment_method"),
    billingCustomerId: input.billingCustomerId,
    provider: input.provider,
    externalMethodId: input.externalMethodId,
    brand: input.brand ?? null,
    last4: input.last4 ?? null,
    isDefault: Boolean(input.isDefault ?? false),
    status: input.status ?? "active",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    deletedAt: input.deletedAt ?? null,
  };
}

export function createBillingEventRecord(input: Partial<BillingEventRecord> & {
  companyId: string;
  eventType: BillingEventRecord["eventType"];
  occurredAt: string;
}): BillingEventRecord {
  const now = new Date().toISOString();

  return {
    id: input.id ?? generateId("billing_event"),
    companyId: input.companyId,
    subscriptionId: input.subscriptionId ?? null,
    billingCustomerId: input.billingCustomerId ?? null,
    eventType: input.eventType,
    provider: input.provider ?? "manual",
    externalEventId: input.externalEventId ?? null,
    actorUserId: input.actorUserId ?? null,
    payload: input.payload ?? null,
    occurredAt: input.occurredAt,
    createdAt: input.createdAt ?? now,
  };
}

export function createAuditLogRecord(input: Partial<AuditLogRecord> & {
  entityType: string;
  entityId: string;
  action: AuditAction;
  createdAt?: string;
}): AuditLogRecord {
  return {
    id: input.id ?? generateId("audit"),
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    actorCompanyId: input.actorCompanyId ?? null,
    metadata: input.metadata ?? null,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function ensureDefaultCollections() {
  const db = readDb();
  const nextDb = {
    ...db,
    companies: Array.isArray(db.companies) ? db.companies : [],
    userCompanies: Array.isArray(db.userCompanies) ? db.userCompanies : [],
    roles: Array.isArray(db.roles) ? db.roles : [],
    permissions: Array.isArray(db.permissions) ? db.permissions : [],
    rolePermissions: Array.isArray(db.rolePermissions) ? db.rolePermissions : [],
    sessions: Array.isArray(db.sessions) ? db.sessions : [],
    billingProducts: Array.isArray(db.billingProducts) ? db.billingProducts : [],
    plans: Array.isArray(db.plans) ? db.plans : [],
    subscriptions: Array.isArray(db.subscriptions) ? db.subscriptions : [],
    billingCustomers: Array.isArray(db.billingCustomers) ? db.billingCustomers : [],
    paymentMethodReferences: Array.isArray(db.paymentMethodReferences) ? db.paymentMethodReferences : [],
    billingEvents: Array.isArray(db.billingEvents) ? db.billingEvents : [],
    auditLogs: Array.isArray(db.auditLogs) ? db.auditLogs : [],
  };

  writeDb(nextDb);
  return nextDb;
}

export function createLegacyCompanyFromUser(user: Partial<SessionUser>): CompanyRecord {
  const normalized = normalizeUser(user);
  const companyName = normalized.company || normalized.nombre || "Mi empresa";

  return createCompanyRecord({
    nombre: companyName,
    slug: slugify(companyName || "mi-empresa"),
    currency: "ARS",
    status: "trial",
  });
}

export function buildDefaultSubscriptionForCompany(companyId: string, productId: string, planId: string): SubscriptionRecord {
  const now = new Date();
  const trialStart = new Date(now);
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 30);

  return createSubscriptionRecord({
    companyId,
    productId,
    planId,
    status: "trial",
    trialStartAt: trialStart.toISOString(),
    trialEndAt: trialEnd.toISOString(),
    startedAt: null,
    nextBillingAt: trialEnd.toISOString(),
    autoRenew: true,
    provider: "manual",
    priceAmount: 0,
    currency: "ARS",
  });
}

export function getActiveCompanyFromSession(user: Partial<SessionUser> | null | undefined): string | null {
  if (!user) return null;
  const tenantId = String((user as { companyId?: string | null; tenantId?: string | null }).companyId ?? (user as { tenantId?: string | null }).tenantId ?? "").trim();
  return tenantId || null;
}

export function canUserAccessCompany(user: Partial<SessionUser> | null | undefined, companyId: string | null | undefined): boolean {
  if (!user || !companyId) return false;
  const activeCompanyId = getActiveCompanyFromSession(user);
  return Boolean(activeCompanyId) && activeCompanyId === companyId;
}

export function ensureUserCompanyAccess(user: Partial<SessionUser> | null | undefined, companyId: string | null | undefined): boolean {
  if (!companyId) return true;
  return canUserAccessCompany(user, companyId);
}

export function createDefaultBillingSeed() {
  const db = readDb();
  const now = new Date().toISOString();

  const existingBillingProducts = Array.isArray(db.billingProducts) ? db.billingProducts : [];
  if (existingBillingProducts.length > 0) return db;

  const stockflow = createBillingProductRecord({
    code: "stockflow",
    name: "StockFlow",
    slug: "stockflow",
    description: "Inventario y gestión empresarial",
    status: "active",
    createdAt: now,
  });

  const stockflowPlus = createBillingProductRecord({
    code: "stockflow_plus",
    name: "StockFlow+",
    slug: "stockflow-plus",
    description: "StockFlow con funcionalidad premium",
    status: "active",
    createdAt: now,
  });

  const planStockflow = createPlanRecord({
    productId: stockflow.id,
    code: "standard",
    name: "Standard",
    amount: 0,
    currency: "ARS",
    billingInterval: "monthly",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const planStockflowPlus = createPlanRecord({
    productId: stockflowPlus.id,
    code: "plus",
    name: "Plus",
    amount: 19900,
    currency: "ARS",
    billingInterval: "monthly",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const nextDb = {
    ...db,
    billingProducts: [stockflow, stockflowPlus],
    plans: [planStockflow, planStockflowPlus],
  };

  writeDb(nextDb);
  return nextDb;
}

export function getGlobalAuditEvent(action: AuditAction, entityType: string, entityId: string, actorUserId?: string | null, metadata?: Record<string, unknown> | null): AuditLogRecord {
  return createAuditLogRecord({
    entityType,
    entityId,
    action,
    actorUserId: actorUserId ?? null,
    actorCompanyId: null,
    metadata: metadata ?? null,
    createdAt: new Date().toISOString(),
  });
}
