import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "stockflow.json");

export type DbData = {
  products: unknown[];
  clientes: unknown[];
  proveedores: unknown[];
  ventas: unknown[];
  compras: unknown[];
  users: unknown[];
  companies: unknown[];
  userCompanies: unknown[];
  roles: unknown[];
  permissions: unknown[];
  rolePermissions: unknown[];
  sessions: unknown[];
  billingProducts: unknown[];
  plans: unknown[];
  subscriptions: unknown[];
  billingCustomers: unknown[];
  paymentMethodReferences: unknown[];
  billingEvents: unknown[];
  auditLogs: unknown[];
};

export function readDb(): DbData {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    throw new Error("Production requires DATABASE_URL. JSON fallback is disabled in production.");
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as DbData;
  } catch {
    return {
      products: [],
      clientes: [],
      proveedores: [],
      ventas: [],
      compras: [],
      users: [],
      companies: [],
      userCompanies: [],
      roles: [],
      permissions: [],
      rolePermissions: [],
      sessions: [],
      billingProducts: [],
      plans: [],
      subscriptions: [],
      billingCustomers: [],
      paymentMethodReferences: [],
      billingEvents: [],
      auditLogs: [],
    };
  }
}

export function writeDb(data: DbData) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function apiCollectionNameForKey(clave: string) {
  switch (clave) {
    case "productos":
      return "products" as const;
    case "clientes":
      return "clientes" as const;
    case "proveedores":
      return "proveedores" as const;
    case "ventas":
      return "ventas" as const;
    case "compras":
      return "compras" as const;
    default:
      return null;
  }
}

export function replaceCollectionData<T>(
  db: DbData,
  collection: "products" | "clientes" | "proveedores" | "ventas" | "compras",
  nextData: T[]
): DbData {
  const nextDb = { ...db };

  nextDb[collection] = Array.isArray(nextData) ? nextData : [nextData];

  return nextDb;
}
