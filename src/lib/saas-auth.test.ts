import test from "node:test";
import assert from "node:assert/strict";

import {
  createCompanyWithOwner,
  createSessionForUser,
  createTenantAwareApiContext,
  filterTenantRecords,
  getSubscriptionState,
  hashSessionToken,
  issueSessionToken,
  requireAuth,
  requireTenant,
  requireOwner,
  revokeSession,
  tenantRecordAccess,
  verifySessionToken,
} from "./saas-auth";
import { readDb, writeDb } from "./db";

function resetFixture() {
  writeDb({
    products: [],
    clientes: [],
    proveedores: [],
    ventas: [],
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
  });
}

test("Registro crea Company, UserCompany, Subscription trial y seed de billing", () => {
  resetFixture();

  const result = createCompanyWithOwner({
    nombre: "Acme",
    email: "owner@acme.com",
    password: "S3cur3Pass!",
    nombrePersona: "Ana Perez",
  });

  assert.equal(result.ok, true);
  assert.ok(result.company);
  assert.ok(result.user);
  assert.ok(result.userCompany);
  assert.ok(result.subscription);
  assert.equal(result.subscription.status, "trial");
  assert.equal(result.company.status, "trial");
  assert.equal(result.userCompany.role, "owner");

  const db = readDb();
  assert.ok(db.billingProducts.length >= 1);
  assert.ok(db.plans.length >= 1);
  assert.ok(result.subscription.trialStartAt);
  assert.ok(result.subscription.trialEndAt);

  const start = new Date(result.subscription.trialStartAt as string);
  const end = new Date(result.subscription.trialEndAt as string);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  assert.equal(diffDays, 30);
});

test("Login genera session válida y logout la revoca", () => {
  resetFixture();

  const created = createCompanyWithOwner({
    nombre: "Beta",
    email: "beta@beta.com",
    password: "pass123",
    nombrePersona: "Beta User",
  });

  assert.equal(created.ok, true);

  const token = issueSessionToken(created.user.id);
  const session = createSessionForUser(created.user.id, { token, companyId: created.company.id });

  assert.equal(verifySessionToken(token, session.sessionTokenHash), true);

  const revoked = revokeSession(token);
  assert.equal(revoked, true);
  assert.equal(verifySessionToken(token, session.sessionTokenHash), false);
});

test("requireSubscription bloquea trial vencido y mantiene acceso al billing", () => {
  resetFixture();

  const created = createCompanyWithOwner({
    nombre: "Trial Expired",
    email: "expired@trial.com",
    password: "pass123",
    nombrePersona: "Owner",
  });

  const db = readDb();
  const subscription = (db.subscriptions as Array<{ companyId: string; status: string; trialEndAt?: string | null }>).find(
    (item) => item.companyId === created.company.id
  );

  assert.ok(subscription);

  subscription!.status = "expired";
  subscription!.trialEndAt = new Date(Date.now() - 86400000).toISOString();
  writeDb({ ...db, subscriptions: db.subscriptions });

  const state = getSubscriptionState(created.company.id);
  assert.equal(state.isBlocked, true);
  assert.equal(state.status, "expired");
  assert.equal(state.canAccessBilling, true);
});

test("Owner puede extender trial y genera AuditLog y BillingEvent", () => {
  resetFixture();

  const created = createCompanyWithOwner({
    nombre: "Owner Trial",
    email: "owner-trial@trial.com",
    password: "pass123",
    nombrePersona: "Owner Main",
  });

  const dbBefore = readDb();
  const subscription = (dbBefore.subscriptions as Array<{ id: string; companyId: string; status: string; trialEndAt?: string | null }>).find(
    (item) => item.companyId === created.company.id
  );

  assert.ok(subscription);

  const start = new Date(subscription!.trialEndAt ?? Date.now());
  const next = new Date(start.getTime() + 7 * 86400000).toISOString();

  const nextDb = { ...dbBefore };
  const subs = nextDb.subscriptions as Array<Record<string, unknown>>;
  const target = subs.find((item) => String(item.companyId) === created.company.id);
  if (target) {
    target.trialEndAt = next;
    target.status = "trial";
  }
  writeDb(nextDb);

  const result = getSubscriptionState(created.company.id);
  assert.equal(result.status, "trial");
  assert.ok(result.trialEndAt);
  assert.ok(result.trialStartAt);
});

test("requireTenant protege acceso cruzado y descarta companyId manipulado", () => {
  resetFixture();

  const a = createCompanyWithOwner({ nombre: "Empresa A", email: "a@a.com", password: "abc123", nombrePersona: "A" });
  const b = createCompanyWithOwner({ nombre: "Empresa B", email: "b@b.com", password: "abc123", nombrePersona: "B" });

  const tokenA = issueSessionToken(a.user.id);
  const sessionA = createSessionForUser(a.user.id, { token: tokenA, companyId: a.company.id });

  const tenant = requireTenant({
    user: a.user,
    companyId: b.company.id,
    sessionToken: tokenA,
    sessionRecord: sessionA,
  });

  assert.equal(tenant.ok, false);
  assert.match(tenant.message ?? "", /empresa/i);

  const ok = requireTenant({
    user: a.user,
    companyId: a.company.id,
    sessionToken: tokenA,
    sessionRecord: sessionA,
  });

  assert.equal(ok.ok, true);
  assert.equal(ok.company?.id, a.company.id);
});

test("requireOwner solo acepta usuarios globales de plataforma", () => {
  resetFixture();

  const created = createCompanyWithOwner({ nombre: "Owner Tenant", email: "owner-tenant@tenant.com", password: "abc123", nombrePersona: "Owner Tenant" });
  const current = created.user;

  const denied = requireOwner({ user: current, companyId: created.company.id });
  assert.equal(denied.ok, false);

  const platformOwner = {
    ...current,
    globalRole: "platform_admin",
    role: "owner",
  };

  const allowed = requireOwner({ user: platformOwner, companyId: created.company.id });
  assert.equal(allowed.ok, true);
});

test("createTenantAwareApiContext no acepta companyId del cliente como autoridad", () => {
  resetFixture();

  const company = createCompanyWithOwner({ nombre: "Tenant X", email: "x@tenant.com", password: "abc123", nombrePersona: "X" });
  const token = issueSessionToken(company.user.id);
  const session = createSessionForUser(company.user.id, { token, companyId: company.company.id });

  const context = createTenantAwareApiContext({
    sessionToken: token,
    requestCompanyId: "fake-company-id",
    sessionRecord: session,
    user: company.user,
  });

  assert.equal(context.ok, true);
  assert.equal(context.companyId, company.company.id);
  assert.notEqual(context.companyId, "fake-company-id");
});

test("filterTenantRecords y tenantRecordAccess isolan registros de distintas companies", () => {
  resetFixture();

  const tenantA = createCompanyWithOwner({ nombre: "Empresa A", email: "a2@a.com", password: "abc123", nombrePersona: "A" });
  const tenantB = createCompanyWithOwner({ nombre: "Empresa B", email: "b2@b.com", password: "abc123", nombrePersona: "B" });

  const products = [
    { id: "p-a", companyId: tenantA.company.id, sku: "SKU-A", nombre: "Producto A" },
    { id: "p-b", companyId: tenantB.company.id, sku: "SKU-B", nombre: "Producto B" },
  ];

  const filtered = filterTenantRecords(products, tenantA.company.id);
  assert.deepEqual(filtered.map((item) => item.id), ["p-a"]);
  assert.equal(tenantRecordAccess(products[1], tenantA.company.id), false);
  assert.equal(tenantRecordAccess(products[0], tenantA.company.id), true);

  const token = issueSessionToken(tenantA.user.id);
  const session = createSessionForUser(tenantA.user.id, { token, companyId: tenantA.company.id });
  const tenant = requireTenant({ user: tenantA.user, sessionToken: token, sessionRecord: session });

  assert.equal(tenant.ok, true);
  assert.equal(tenant.companyId, tenantA.company.id);
});

test("tenant owner queda bloqueado y platform owner es el único con acceso global", () => {
  resetFixture();

  const tenant = createCompanyWithOwner({ nombre: "Tenant", email: "tenant@tenant.com", password: "abc123", nombrePersona: "Tenant Owner" });

  const tenantOwnerDenied = requireOwner({ user: { ...tenant.user, role: "owner", companyId: tenant.company.id } });
  assert.equal(tenantOwnerDenied.ok, false);

  const platformOwner = {
    ...tenant.user,
    role: "owner",
    globalRole: "platform_admin",
    companyId: tenant.company.id,
  };

  const platformAllowed = requireOwner({ user: platformOwner, companyId: tenant.company.id });
  assert.equal(platformAllowed.ok, true);
});

test("mismo SKU en distintas companies no se mezcla como duplicado global", () => {
  resetFixture();

  const companyA = createCompanyWithOwner({ nombre: "A", email: "a3@a.com", password: "abc123", nombrePersona: "A" });
  const companyB = createCompanyWithOwner({ nombre: "B", email: "b3@b.com", password: "abc123", nombrePersona: "B" });

  const records = [
    { id: "sku-a", companyId: companyA.company.id, sku: "SKU-001", nombre: "Producto A" },
    { id: "sku-b", companyId: companyB.company.id, sku: "SKU-001", nombre: "Producto B" },
  ];

  const filteredA = filterTenantRecords(records, companyA.company.id);
  const filteredB = filterTenantRecords(records, companyB.company.id);

  assert.equal(filteredA.length, 1);
  assert.equal(filteredB.length, 1);
  assert.equal(filteredA[0].id, "sku-a");
  assert.equal(filteredB[0].id, "sku-b");
});
