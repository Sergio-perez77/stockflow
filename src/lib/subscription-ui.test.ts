import test from "node:test";
import assert from "node:assert/strict";

import { getDaysRemaining, getSubscriptionStatusSummary } from "./subscription-ui";

test("Usuario con trial activo ve trial y días restantes reales", () => {
  const summary = getSubscriptionStatusSummary({
    status: "trial",
    trialEndAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  });

  assert.equal(summary.status, "trial");
  assert.equal(summary.label, "Prueba gratuita");
  assert.equal(summary.daysRemaining, 3);
  assert.match(summary.message, /prueba gratuita|quedan/i);
});

test("Días restantes se calculan correctamente", () => {
  const days = getDaysRemaining(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString());
  assert.equal(days, 5);
});

test("Trial vencido muestra estado expired", () => {
  const summary = getSubscriptionStatusSummary({
    status: "expired",
    trialEndAt: new Date(Date.now() - 1000).toISOString(),
  });

  assert.equal(summary.status, "expired");
  assert.match(summary.message, /período de prueba terminó|Elegí un plan/i);
});

test("Usuario activo muestra active", () => {
  const summary = getSubscriptionStatusSummary({
    status: "active",
    startedAt: new Date().toISOString(),
  });

  assert.equal(summary.status, "active");
  assert.equal(summary.label, "Suscripción activa");
});

test("Usuario suspendido muestra suspended", () => {
  const summary = getSubscriptionStatusSummary({
    status: "suspended",
  });

  assert.equal(summary.status, "suspended");
  assert.match(summary.message, /restringido|regularizar/i);
});
