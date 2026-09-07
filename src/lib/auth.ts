export type UserRole = "admin" | "gerente" | "vendedor";
export type SubscriptionPlan = "demo" | "saas" | "erp";
export type FeatureKey =
  | "dashboard"
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
  password?: string;
};

const FEATURE_ACCESS: Record<
  FeatureKey,
  { roles: UserRole[]; plans: SubscriptionPlan[] }
> = {
  dashboard: { roles: ["admin", "gerente", "vendedor"], plans: ["demo", "saas", "erp"] },
  productos: { roles: ["admin", "gerente", "vendedor"], plans: ["demo", "saas", "erp"] },
  clientes: { roles: ["admin", "gerente", "vendedor"], plans: ["demo", "saas", "erp"] },
  usuarios: { roles: ["admin", "gerente"], plans: ["saas", "erp"] },
  suscripciones: { roles: ["admin", "gerente"], plans: ["saas", "erp"] },
  proveedores: { roles: ["admin", "gerente"], plans: ["saas", "erp"] },
  compras: { roles: ["admin", "gerente"], plans: ["erp"] },
  ventas: { roles: ["admin", "gerente", "vendedor"], plans: ["demo", "saas", "erp"] },
  reportes: { roles: ["admin", "gerente"], plans: ["saas", "erp"] },
  configuracion: { roles: ["admin", "gerente"], plans: ["saas", "erp"] },
  categorias: { roles: ["admin", "gerente"], plans: ["saas", "erp"] },
};

export const SESSION_KEY = "stockflow_session";
export const USERS_KEY = "stockflow_users";

export const DEMO_USER: SessionUser = {
  id: "demo-admin",
  nombre: "Sergio P.",
  email: "admin@stockflow.com",
  password: "stockflow123",
  role: "admin",
  plan: "demo",
};

export function normalizeUser(user: Partial<SessionUser>): SessionUser {
  const nombre = String(user.nombre ?? "").trim().replace(/\s+/g, " ");
  const email = String(user.email ?? "").trim().toLowerCase();
  const password = String(user.password ?? "").trim();
  const role = (user.role ?? "vendedor") as UserRole;
  const plan = (user.plan ?? "saas") as SubscriptionPlan;

  return {
    id: String(user.id ?? `user-${Date.now()}`),
    nombre: nombre || "Usuario",
    email: email || "usuario@stockflow.com",
    password,
    role: ["admin", "gerente", "vendedor"].includes(role) ? role : "vendedor",
    plan: ["demo", "saas", "erp"].includes(plan) ? plan : "saas",
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
    role: normalized.role ?? "vendedor",
    plan: normalized.plan ?? "saas",
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

  localStorage.setItem(SESSION_KEY, JSON.stringify(normalizeUser(user)));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_KEY);
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
  const access = FEATURE_ACCESS[feature] ?? {
    roles: ["admin", "gerente", "vendedor"],
    plans: ["demo", "saas", "erp"],
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
    plan: ["demo", "saas", "erp"].includes(plan) ? plan : "saas",
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
  }

  return nextUser;
}

export function getFeatureForPath(pathname: string): FeatureKey | null {
  const normalized = pathname.replace(/^\/+|\/+$/g, "");

  if (!normalized || normalized === "dashboard") return "dashboard";

  const mapping: Record<string, FeatureKey> = {
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
