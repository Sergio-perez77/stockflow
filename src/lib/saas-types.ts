export type GlobalRole = "stockflow_owner" | "support_admin" | "platform_admin";
export type CompanyRole = "owner" | "admin" | "manager" | "staff" | "viewer";
export type ProductStatus = "active" | "archived";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "suspended";
export type BillingProvider = "stripe" | "mercadopago" | "manual" | "custom";
export type PaymentMethodStatus = "active" | "failed" | "expired" | "deleted";
export type AuditAction =
  | "trial_started"
  | "trial_ended"
  | "subscription_activated"
  | "subscription_canceled"
  | "subscription_suspended"
  | "subscription_renewed"
  | "payment_succeeded"
  | "payment_failed"
  | "plan_changed"
  | "trial_modified"
  | "login"
  | "logout"
  | "session_revoked"
  | "company_created"
  | "user_assigned_to_company"
  | "permission_changed";

export type UserCompanyRole = {
  id: string;
  userId: string;
  companyId: string;
  role: CompanyRole;
  isOwner: boolean;
  invitedByUserId?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyRecord = {
  id: string;
  nombre: string;
  slug: string;
  logoUrl?: string | null;
  emailContacto?: string | null;
  telefono?: string | null;
  pais?: string | null;
  timezone?: string;
  currency: string;
  status: "active" | "trial" | "suspended" | "canceled";
  createdAt: string;
  updatedAt: string;
};

export type BillingProductRecord = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  status: ProductStatus;
  createdAt: string;
};

export type PlanRecord = {
  id: string;
  productId: string;
  code: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  billingInterval: "monthly" | "yearly" | "trial";
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionRecord = {
  id: string;
  companyId: string;
  productId: string;
  planId: string;
  status: SubscriptionStatus;
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  nextBillingAt?: string | null;
  autoRenew: boolean;
  cancelAt?: string | null;
  cancelReason?: string | null;
  externalSubscriptionId?: string | null;
  provider: BillingProvider;
  priceAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type BillingCustomerRecord = {
  id: string;
  companyId: string;
  provider: BillingProvider;
  externalCustomerId: string;
  status: "active" | "inactive" | "pending" | "deleted";
  defaultPaymentMethodId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethodReferenceRecord = {
  id: string;
  billingCustomerId: string;
  provider: BillingProvider;
  externalMethodId: string;
  brand?: string | null;
  last4?: string | null;
  isDefault: boolean;
  status: PaymentMethodStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type BillingEventRecord = {
  id: string;
  companyId: string;
  subscriptionId?: string | null;
  billingCustomerId?: string | null;
  eventType: AuditAction;
  provider?: BillingProvider | null;
  externalEventId?: string | null;
  actorUserId?: string | null;
  payload?: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};

export type AuditLogRecord = {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorUserId?: string | null;
  actorCompanyId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  companyId?: string | null;
  sessionTokenHash: string;
  refreshTokenHash?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceId?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
  lastSeenAt: string;
};

export type RoleRecord = {
  id: string;
  scope: "global" | "company";
  name: GlobalRole | CompanyRole;
  description?: string | null;
  createdAt: string;
};

export type PermissionRecord = {
  id: string;
  key: string;
  description?: string | null;
  createdAt: string;
};

export type RolePermissionRecord = {
  id: string;
  roleName: string;
  permissionKey: string;
  createdAt: string;
};
