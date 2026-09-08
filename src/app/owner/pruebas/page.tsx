"use client";

import { useEffect, useMemo, useState } from "react";

import { getTrialSummaryForClient } from "@/lib/owner-client";
import type { OwnerUserRecord } from "@/lib/owner-types";

const trialActions: Array<{ key: string; label: string; extra?: number }> = [
  { key: "activate_trial", label: "Activar prueba" },
  { key: "deactivate_trial", label: "Desactivar prueba" },
  { key: "reset_trial", label: "Reiniciar prueba" },
  { key: "add_days", label: "+7 días", extra: 7 },
  { key: "remove_days", label: "-7 días", extra: 7 },
];

export default function OwnerPruebasPage() {
  const [users, setUsers] = useState<OwnerUserRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    const response = await fetch("/api/owner/users");
    const payload = await response.json();
    const data = Array.isArray(payload?.data) ? payload.data : [];
    setUsers(data.filter((user: OwnerUserRecord) => user.role !== "owner"));
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const summary = useMemo(() => {
    const active = users.filter((user) => user.trialEnabled && user.subscriptionStatus === "trial").length;
    const expiring = users.filter((user) => {
      if (!user.trialEnabled && user.subscriptionStatus !== "trial") return false;
      return getTrialSummaryForClient(user).remainingDays > 0 && getTrialSummaryForClient(user).remainingDays <= 7;
    }).length;
    const expired = users.filter((user) => getTrialSummaryForClient(user).isExpired).length;

    return { active, expiring, expired };
  }, [users]);

  const runAction = async (userId: string, action: string, days = 0) => {
    setLoading(true);
    try {
      await fetch(`/api/owner/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, days }),
      });
      await loadUsers();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Pruebas</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Gestión de pruebas</h2>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Usuarios en prueba</p>
          <p className="mt-3 text-3xl font-bold text-white">{users.filter((user) => user.trialEnabled || user.subscriptionStatus === "trial").length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Pruebas activas</p>
          <p className="mt-3 text-3xl font-bold text-white">{summary.active}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Pruebas próximas a vencer</p>
          <p className="mt-3 text-3xl font-bold text-white">{summary.expiring}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Pruebas vencidas</p>
          <p className="mt-3 text-3xl font-bold text-white">{summary.expired}</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Inicio</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium">Días transcurridos</th>
                <th className="px-4 py-3 font-medium">Días restantes</th>
                <th className="px-4 py-3 font-medium">Medio de pago</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const trial = getTrialSummaryForClient(user);
                const paymentStatus = user.paymentMethodStatus === "ready" ? "✓ Registrado" : "⚠ Pendiente";

                return (
                  <tr key={user.id} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3">{user.nombre}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.product === "stockflow_plus" ? "StockFlow+" : "StockFlow"}</td>
                    <td className="px-4 py-3 capitalize">{user.plan.replace("_", " ")}</td>
                    <td className="px-4 py-3">{user.trialStartedAt ?? "—"}</td>
                    <td className="px-4 py-3">{user.trialEndsAt ?? "—"}</td>
                    <td className="px-4 py-3">{trial.elapsedDays}</td>
                    <td className="px-4 py-3">{trial.remainingDays}</td>
                    <td className="px-4 py-3">{paymentStatus}</td>
                    <td className="px-4 py-3">{trial.isExpired ? "Vencida" : user.trialEnabled ? "Activa" : "Inactiva"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {trialActions.map((action) => (
                          <button
                            key={action.key}
                            type="button"
                            disabled={loading}
                            onClick={() => runAction(user.id, action.key, action.extra ?? 0)}
                            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
