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
import {
  addTrialDays,
  getPlusUsers,
  getPromotionSummary,
  getTrialSummary,
  normalizeOwnerUser,
  setTrialWindow,
} from "./owner.ts";

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

test("la prueba de 30 días se calcula correctamente y expira cuando corresponde", () => {
  const today = new Date();
  const startedAt = new Date(today);
  startedAt.setDate(today.getDate() - 7);
  const endsAt = new Date(today);
  endsAt.setDate(today.getDate() + 23);

  const user = normalizeOwnerUser({
    id: "trial-1",
    nombre: "Juan",
    email: "juan@stockflow.com",
    role: "user",
    product: "stockflow",
    plan: "free_trial",
    subscriptionStatus: "trial",
    trialEnabled: true,
    trialStartedAt: startedAt.toISOString().slice(0, 10),
    trialEndsAt: endsAt.toISOString().slice(0, 10),
  });

  const summary = getTrialSummary(user);

  assert.equal(summary.remainingDays >= 1, true);
  assert.ok(summary.endDate);
  assert.equal(summary.isExpired, false);

  const expiredUser = normalizeOwnerUser({
    ...user,
    trialEnabled: true,
    trialEndsAt: new Date(today.getTime() - 86400000).toISOString().slice(0, 10),
  });

  const expiredSummary = getTrialSummary(expiredUser);
  assert.equal(expiredSummary.isExpired, true);
  assert.equal(expiredSummary.remainingDays, 0);
});

test("agregar días modifica la fecha real de finalización y no manualiza un contador", () => {
  const base = normalizeOwnerUser({
    id: "trial-2",
    nombre: "Ana",
    email: "ana@stockflow.com",
    role: "user",
    product: "stockflow",
    plan: "free_trial",
    subscriptionStatus: "trial",
    trialEnabled: true,
    trialStartedAt: "2026-09-01",
    trialEndsAt: "2026-09-30",
  });

  const updated = addTrialDays(base, 7);
  const summary = getTrialSummary(updated);

  assert.ok(updated.trialEndsAt);
  assert.ok(summary.remainingDays >= 28);
  assert.strictEqual(updated.trialEndsAt, "2026-10-07");
});

test("owner no cuenta en promociones y el reparto sigue el orden real de registro", () => {
  const today = new Date().toISOString().slice(0, 10);
  const users = [
    { id: "owner-1", nombre: "Owner", email: "owner@stockflow.com", role: "owner", product: "stockflow_plus", plan: "plus", createdAt: today },
    { id: "u-1", nombre: "Cliente 1", email: "c1@stockflow.com", role: "user", product: "stockflow", plan: "free_trial", createdAt: today },
    { id: "u-2", nombre: "Cliente 2", email: "c2@stockflow.com", role: "user", product: "stockflow", plan: "free_trial", createdAt: today },
    { id: "u-100", nombre: "Cliente 100", email: "c100@stockflow.com", role: "user", product: "stockflow", plan: "free_trial", createdAt: today },
    { id: "u-101", nombre: "Cliente 101", email: "c101@stockflow.com", role: "user", product: "stockflow", plan: "standard", createdAt: today },
    { id: "u-200", nombre: "Cliente 200", email: "c200@stockflow.com", role: "user", product: "stockflow", plan: "standard", createdAt: today },
    { id: "u-201", nombre: "Cliente 201", email: "c201@stockflow.com", role: "user", product: "stockflow", plan: "standard", createdAt: today },
  ].map((user) => normalizeOwnerUser(user));

  const summary = getPromotionSummary(users);

  assert.equal(summary.first100Used, 3);
  assert.equal(summary.second100Used, 2);
  assert.equal(summary.totalEligibleUsers, 5);
  assert.equal(summary.first100Remaining, 97);
  assert.equal(summary.second100Remaining, 98);
  assert.equal(summary.promoForUserIndex(0), "first-100");
  assert.equal(summary.promoForUserIndex(99), "first-100");
  assert.equal(summary.promoForUserIndex(100), "next-100");
  assert.equal(summary.promoForUserIndex(200), "next-100");
  assert.equal(summary.promoForUserIndex(201), "outside");
});

test("plus se identifica correctamente y se prepara el modelo de pago", () => {
  const user = normalizeOwnerUser({
    id: "plus-1",
    nombre: "Plus User",
    email: "plus@stockflow.com",
    role: "user",
    product: "stockflow_plus",
    plan: "plus",
    subscriptionStatus: "active",
    paymentMethodStatus: "ready",
    paymentProvider: "stripe",
    paymentCustomerId: "cus_123",
    paymentMethodId: "pm_123",
    autoRenew: true,
  });

  const plusUsers = getPlusUsers([user]);
  assert.equal(plusUsers.length, 1);
  assert.equal(user.product, "stockflow_plus");
  assert.equal(user.plan, "plus");
  assert.equal(user.paymentMethodStatus, "ready");
  assert.equal(user.paymentProvider, "stripe");
  assert.equal(user.autoRenew, true);

  const noPlus = normalizeOwnerUser({
    id: "trial-3",
    nombre: "No Plus",
    email: "trial@stockflow.com",
    role: "user",
    product: "stockflow",
    plan: "free_trial",
    subscriptionStatus: "trial",
  });

  assert.equal(getPlusUsers([noPlus]).length, 0);
});

test("setTrialWindow crea fechas de 30 días para la prueba estandar", () => {
  const user = setTrialWindow(normalizeOwnerUser({
    id: "trial-4",
    nombre: "Prueba",
    email: "prueba@stockflow.com",
    role: "user",
    product: "stockflow",
    plan: "free_trial",
    subscriptionStatus: "trial",
    trialEnabled: true,
  }));

  assert.equal(user.plan, "free_trial");
  assert.equal(user.product, "stockflow");
  assert.equal(user.trialEnabled, true);
  assert.ok(user.trialStartedAt);
  assert.ok(user.trialEndsAt);
  assert.equal(user.subscriptionStatus, "trial");
});
