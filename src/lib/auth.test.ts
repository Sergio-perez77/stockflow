import test from "node:test";
import assert from "node:assert/strict";

import {
  authenticate,
  canAccessFeature,
  createUser,
  getUsers,
  normalizeUser,
  updateUserPlan,
  type SessionUser,
} from "./auth.ts";

test("normalizeUser agrega defaults y normaliza role", () => {
  const user = normalizeUser({
    id: "u-1",
    nombre: "  Ana   Perez  ",
    email: " ANA@MAIL.COM ",
    role: "vendedor",
    password: "secret",
  });

  assert.equal(user.nombre, "Ana Perez");
  assert.equal(user.email, "ana@mail.com");
  assert.equal(user.role, "vendedor");
  assert.equal(user.password, "secret");
});

test("normalizeUser acepta owner y estructura de suscripción", () => {
  const owner = normalizeUser({
    id: "owner-1",
    nombre: "Dueño",
    email: "owner@stockflow.com",
    role: "owner",
    password: "secret",
    product: "stockflow_plus",
    plan: "plus",
    subscriptionStatus: "active",
    trialEnabled: true,
    trialStartedAt: "2026-08-01",
    trialEndsAt: "2026-08-31",
  });

  assert.equal(owner.role, "owner");
  assert.equal(owner.product, "stockflow_plus");
  assert.equal(owner.plan, "plus");
  assert.equal(owner.subscriptionStatus, "active");
  assert.equal(owner.trialEnabled, true);
});

test("authenticate valida usuarios guardados y demo", () => {
  const stored: SessionUser[] = [
    {
      id: "u-2",
      nombre: "Luis",
      email: "luis@stockflow.com",
      password: "abc123",
      role: "gerente",
    },
  ];

  const user = authenticate("luis@stockflow.com", "abc123", stored);

  assert.ok(user);
  assert.equal(user?.email, "luis@stockflow.com");
  assert.equal(user?.role, "gerente");

  const demo = authenticate("admin@stockflow.com", "stockflow123");
  assert.ok(demo);
  assert.equal(demo?.role, "owner");
});

test("createUser agrega usuario con rol por defecto y no duplica email", () => {
  const usuarios = [
    {
      id: "u-1",
      nombre: "Admin",
      email: "admin@stockflow.com",
      password: "stockflow123",
      role: "admin",
    },
  ];

  const nuevo = createUser(usuarios, {
    nombre: "Carlos",
    email: "carlos@ejemplo.com",
    password: "123456",
  });

  assert.ok(nuevo);
  assert.equal(nuevo?.email, "carlos@ejemplo.com");
  assert.equal(nuevo?.role, "user");

  const duplicado = createUser(usuarios, {
    nombre: "Admin 2",
    email: "admin@stockflow.com",
    password: "x",
  });

  assert.equal(duplicado, null);
});

test("getUsers devuelve lista sin valores vacíos", () => {
  const data = [
    { id: "a", nombre: "A", email: "a@a.com", password: "1", role: "admin" },
    { id: "b", nombre: "", email: "b@b.com", password: "2", role: "admin" },
  ];

  const users = getUsers(data as any);
  assert.ok(users.some((user) => user.nombre === "A"));
  assert.ok(users.every((user) => user.nombre.trim().length > 0));
});

test("updateUserPlan actualiza la sesión y el plan del usuario", () => {
  const storage = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };

  // @ts-expect-error - stub para pruebas de persistencia local
  globalThis.window = { localStorage };

  const usuario = normalizeUser({
    id: "u-9",
    nombre: "Maria",
    email: "maria@stockflow.com",
    password: "123456",
    role: "gerente",
    plan: "saas",
  });

  const actualizado = updateUserPlan(usuario, "erp");

  assert.equal(actualizado.plan, "erp");
  assert.equal(
    JSON.parse(String(storage.get("stockflow_session") ?? "{}"))?.plan,
    "erp"
  );
  assert.equal(
    JSON.parse(String(storage.get("stockflow_users") ?? "[]"))
      .find((user: { email: string }) => user.email === "maria@stockflow.com")?.plan,
    "erp"
  );
});

test("canAccessFeature restringe rutas por rol y plan", () => {
  const admin = normalizeUser({
    nombre: "Admin",
    email: "admin@stockflow.com",
    password: "stockflow123",
    role: "admin",
    plan: "saas",
  });

  const vendedor = normalizeUser({
    nombre: "Vendedor",
    email: "vendedor@stockflow.com",
    password: "123456",
    role: "vendedor",
    plan: "demo",
  });

  const gerente = normalizeUser({
    nombre: "Gerente",
    email: "gerente@stockflow.com",
    password: "123456",
    role: "gerente",
    plan: "erp",
  });

  assert.equal(canAccessFeature(admin, "usuarios"), true);
  assert.equal(canAccessFeature(vendedor, "usuarios"), false);
  assert.equal(canAccessFeature(vendedor, "ventas"), true);
  assert.equal(canAccessFeature(vendedor, "configuracion"), false);
  assert.equal(canAccessFeature(gerente, "reportes"), true);
  assert.equal(canAccessFeature(gerente, "suscripciones"), true);
  assert.equal(canAccessFeature(vendedor, "suscripciones"), false);
});
