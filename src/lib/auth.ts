export type UserRole = "admin" | "gerente" | "vendedor" | "owner" | "user";
export type ProductType = "stockflow" | "stockflow_plus";
export type SubscriptionPlan =
  | "demo"
  | "saas"
  | "erp"
  | "free_trial"
  | "standard"
  | "plus";
export type SubscriptionStatus = "trial" | "active" | "expired" | "suspended";
export type FeatureKey =
  | "dashboard"
  | "owner"
  | "productos"
  | "clientes"
  | "usuarios"
  | "suscripciones"
  | "proveedores"
  | "compras"
  | "ventas"
  | "reportes"
  | "configuracion"
  | "categorias";

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
  product?: ProductType;
  company?: string;
  createdAt?: string;
  subscriptionStatus?: SubscriptionStatus;
  trialEnabled?: boolean;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  discountPercent?: number;
  promotionId?: string | null;
  password?: string;
};

const FEATURE_ACCESS: Record<
  FeatureKey,
  { roles: UserRole[]; plans: SubscriptionPlan[] }
> = {
  dashboard: { roles: ["admin", "gerente", "vendedor", "owner", "user"], plans: ["demo", "saas", "erp", "free_trial", "standard", "plus"] },
  owner: { roles: ["owner"], plans: ["demo", "saas", "erp", "free_trial", "standard", "plus"] },
  productos: { roles: ["admin", "gerente", "vendedor", "owner"], plans: ["demo", "saas", "erp", "free_trial", "standard", "plus"] },
  clientes: { roles: ["admin", "gerente", "vendedor", "owner"], plans: ["demo", "saas", "erp", "free_trial", "standard", "plus"] },
  usuarios: { roles: ["admin", "gerente", "owner"], plans: ["saas", "erp", "standard", "plus"] },
  suscripciones: { roles: ["admin", "gerente", "owner"], plans: ["saas", "erp", "standard", "plus"] },
  proveedores: { roles: ["admin", "gerente", "owner"], plans: ["saas", "erp", "standard", "plus"] },
  compras: { roles: ["admin", "gerente", "owner"], plans: ["erp", "standard", "plus"] },
  ventas: { roles: ["admin", "gerente", "vendedor", "owner"], plans: ["demo", "saas", "erp", "free_trial", "standard", "plus"] },
  reportes: { roles: ["admin", "gerente", "owner"], plans: ["saas", "erp", "standard", "plus"] },
  configuracion: { roles: ["admin", "gerente", "owner"], plans: ["saas", "erp", "standard", "plus"] },
  categorias: { roles: ["admin", "gerente", "owner"], plans: ["saas", "erp", "standard", "plus"] },
};

export const SESSION_KEY = "stockflow_session";
export const USERS_KEY = "stockflow_users";
const VALID_ROLES: UserRole[] = ["admin", "gerente", "vendedor", "owner", "user"];
const VALID_PLANS: SubscriptionPlan[] = ["demo", "saas", "erp", "free_trial", "standard", "plus"];
const VALID_PRODUCTS: ProductType[] = ["stockflow", "stockflow_plus"];
const VALID_SUBSCRIPTION_STATUS: SubscriptionStatus[] = ["trial", "active", "expired", "suspended"];

function normalizeRole(role?: UserRole | string): UserRole {
  const normalized = String(role ?? "user").trim().toLowerCase();
  return VALID_ROLES.includes(normalized as UserRole) ? (normalized as UserRole) : "user";
}

function normalizeProduct(product?: ProductType | string): ProductType {
  const normalized = String(product ?? "stockflow").trim().toLowerCase();
  return VALID_PRODUCTS.includes(normalized as ProductType) ? (normalized as ProductType) : "stockflow";
}

function normalizePlan(plan?: SubscriptionPlan | string): SubscriptionPlan {
  const normalized = String(plan ?? "standard").trim().toLowerCase();

  if (normalized === "free-trial") return "free_trial";
  if (normalized === "plus") return "plus";
  if (normalized === "standard") return "standard";
  if (normalized === "demo") return "demo";
  if (normalized === "saas") return "saas";
  if (normalized === "erp") return "erp";

  return VALID_PLANS.includes(normalized as SubscriptionPlan)
    ? (normalized as SubscriptionPlan)
    : "standard";
}

function normalizeSubscriptionStatus(status?: SubscriptionStatus | string): SubscriptionStatus {
  const normalized = String(status ?? "active").trim().toLowerCase();
  return VALID_SUBSCRIPTION_STATUS.includes(normalized as SubscriptionStatus)
    ? (normalized as SubscriptionStatus)
    : "active";
}

export function isOwnerRole(user?: Partial<SessionUser> | SessionUser | null): boolean {
  const role = normalizeRole(user?.role);
  return role === "owner" || role === "admin";
}

export function getSessionCookieValue(raw?: string | null): SessionUser | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed.email || !parsed.nombre) return null;
    return normalizeUser(parsed as Partial<SessionUser>);
  } catch {
    return null;
  }
}

function setSessionCookieValue(user: SessionUser) {
  if (typeof document === "undefined") return;

  const nextUser = normalizeUser(user);
  const payload = encodeURIComponent(JSON.stringify(nextUser));
  document.cookie = `${SESSION_KEY}=${payload}; path=/; max-age=86400; SameSite=Lax`;
}

export const DEMO_USER: SessionUser = {
  id: "demo-owner",
  nombre: "Sergio P.",
  email: "admin@stockflow.com",
  password: "stockflow123",
  role: "owner",
  product: "stockflow_plus",
  plan: "plus",
  subscriptionStatus: "active",
  trialEnabled: false,
  createdAt: new Date().toISOString().slice(0, 10),
  discountPercent: 0,
  promotionId: null,
};

export function normalizeUser(user: Partial<SessionUser>): SessionUser {
  const nombre = String(user.nombre ?? "").trim().replace(/\s+/g, " ");
  const email = String(user.email ?? "").trim().toLowerCase();
  const password = String(user.password ?? "").trim();
  const role = normalizeRole(user.role);
  const product = normalizeProduct(user.product ?? (role === "owner" ? "stockflow_plus" : "stockflow"));
  const plan = normalizePlan(user.plan ?? (product === "stockflow_plus" ? "plus" : "standard"));
  const subscriptionStatus = normalizeSubscriptionStatus(
    user.subscriptionStatus ?? (user.trialEnabled ? "trial" : "active")
  );

  return {
    id: String(user.id ?? `user-${Date.now()}`),
    nombre: nombre || "Usuario",
    email: email || "usuario@stockflow.com",
    password,
    role,
    product,
    plan,
    company: String(user.company ?? "").trim() || undefined,
    createdAt: user.createdAt ?? new Date().toISOString().slice(0, 10),
    subscriptionStatus,
    trialEnabled: Boolean(user.trialEnabled ?? (subscriptionStatus === "trial")),
    trialStartedAt: user.trialStartedAt ?? null,
    trialEndsAt: user.trialEndsAt ?? null,
    discountPercent: Number.isFinite(Number(user.discountPercent)) ? Number(user.discountPercent) : 0,
    promotionId: user.promotionId ?? null,
  };
}

export function getUsers(initialUsers: SessionUser[] = []): SessionUser[] {
  const fallbackUsers = initialUsers.length > 0 ? initialUsers : [DEMO_USER];

  if (typeof window === "undefined") {
    return fallbackUsers
      .map((user) => normalizeUser(user))
      .filter((user) => user.email && user.nombre);
  }

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const usuarios = raw ? JSON.parse(raw) : fallbackUsers;
    const list = Array.isArray(usuarios) ? usuarios : fallbackUsers;

    const validUsers = list
      .map((user) => normalizeUser(user as Partial<SessionUser>))
      .filter((user) => user.email && user.nombre && user.email !== "usuario@stockflow.com");

    const merged = [DEMO_USER, ...validUsers.filter((user) => user.email !== DEMO_USER.email)];
    window.localStorage.setItem(USERS_KEY, JSON.stringify(merged));

    return merged;
  } catch {
    return fallbackUsers
      .map((user) => normalizeUser(user))
      .filter((user) => user.email && user.nombre);
  }
}

export function createUser(
  users: SessionUser[] = getUsers(),
  payload: Partial<SessionUser>
): SessionUser | null {
  const normalized = normalizeUser(payload);
  const list = users.map((user) => normalizeUser(user));

  if (list.some((user) => user.email.toLowerCase() === normalized.email.toLowerCase())) {
    return null;
  }

  const nuevoUsuario: SessionUser = {
    ...normalized,
    role: normalized.role ?? "user",
    plan: normalized.plan ?? "standard",
    product: normalized.product ?? "stockflow",
    password: normalized.password || "stockflow123",
  };

  const finalUsers = [...list, nuevoUsuario];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(finalUsers));
  }

  return nuevoUsuario;
}

export function getStoredSession(): SessionUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SessionUser>;

    if (!parsed.email || !parsed.nombre) return null;

    return normalizeUser(parsed as Partial<SessionUser>);
  } catch {
    return null;
  }
}

export function setStoredSession(user: SessionUser) {
  if (typeof window === "undefined") return;

  const normalizedUser = normalizeUser(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(normalizedUser));
  setSessionCookieValue(normalizedUser);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function authenticate(
  email: string,
  password: string,
  users: SessionUser[] = getUsers()
): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const usersList = users.map((user) => normalizeUser(user));

  const matched = usersList.find((user) => {
    const userPassword = String(user.password ?? "").trim();
    return user.email === normalizedEmail && userPassword === password.trim();
  });

  if (matched) {
    return {
      ...matched,
      password: undefined,
    };
  }

  if (
    normalizedEmail === DEMO_USER.email &&
    String(DEMO_USER.password ?? "") === password.trim()
  ) {
    return {
      ...DEMO_USER,
      password: undefined,
    };
  }

  return null;
}

export function canAccessFeature(
  user: Partial<SessionUser> | SessionUser | null | undefined,
  feature: FeatureKey
): boolean {
  if (!user) return false;

  const normalizedUser = normalizeUser(user as Partial<SessionUser>);

  if (feature === "owner") {
    return normalizedUser.role === "owner" || normalizedUser.role === "admin";
  }

  if (normalizedUser.role === "owner") {
    return true;
  }

  const access = FEATURE_ACCESS[feature] ?? {
    roles: ["admin", "gerente", "vendedor", "user"],
    plans: ["demo", "saas", "erp", "free_trial", "standard", "plus"],
  };

  return (
    access.roles.includes(normalizedUser.role) &&
    access.plans.includes(normalizedUser.plan)
  );
}

export function updateUserPlan(
  user: Partial<SessionUser> | SessionUser | null | undefined,
  plan: SubscriptionPlan
): SessionUser {
  const normalizedUser = normalizeUser(user ?? {});
  const nextUser = {
    ...normalizedUser,
    plan: VALID_PLANS.includes(plan) ? plan : "standard",
  };

  if (typeof window !== "undefined") {
    const users = getUsers();
    const existingIndex = users.findIndex(
      (storedUser) =>
        storedUser.email.toLowerCase() === nextUser.email.toLowerCase()
    );

    const updatedUsers =
      existingIndex >= 0
        ? users.map((storedUser, index) =>
            index === existingIndex ? nextUser : storedUser
          )
        : [...users, nextUser];

    window.localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setSessionCookieValue(nextUser);
  }

  return nextUser;
}

export function getFeatureForPath(pathname: string): FeatureKey | null {
  const normalized = pathname.replace(/^\/+|\/+$/g, "");

  if (!normalized || normalized === "dashboard") return "dashboard";

  const mapping: Record<string, FeatureKey> = {
    owner: "owner",
    "owner/usuarios": "owner",
    "owner/pruebas": "owner",
    "owner/promociones": "owner",
    "owner/plus": "owner",
    "dashboard/productos": "productos",
    "dashboard/clientes": "clientes",
    "dashboard/usuarios": "usuarios",
    "dashboard/suscripciones": "suscripciones",
    "dashboard/proveedores": "proveedores",
    "dashboard/compras": "compras",
    "dashboard/ventas": "ventas",
    "dashboard/reportes": "reportes",
    "dashboard/configuracion": "configuracion",
    "dashboard/categorias": "categorias",
  };

  return mapping[normalized] ?? null;
}
