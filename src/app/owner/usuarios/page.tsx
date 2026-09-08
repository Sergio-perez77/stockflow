"use client";

import { useEffect, useMemo, useState } from "react";

import { getTrialSummaryForClient } from "@/lib/owner-client";
import type { OwnerUserRecord } from "@/lib/owner-types";

export default function OwnerUsersPage() {
  const [users, setUsers] = useState<OwnerUserRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/users")
      .then((response) => response.json())
      .then((payload) => {
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setUsers(data.filter((user: OwnerUserRecord) => user.role !== "owner"));
      })
      .catch(() => setUsers([]));
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedId) ?? users[0] ?? null,
    [selectedId, users]
  );

  useEffect(() => {
    if (!selectedId && users[0]) setSelectedId(users[0].id);
  }, [selectedId, users]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Usuarios</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Listado de usuarios</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Prueba</th>
                <th className="px-4 py-3 font-medium">Días restantes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const trial = getTrialSummaryForClient(user);

                return (
                  <tr
                    key={user.id}
                    className={`cursor-pointer border-t border-slate-800 text-slate-200 transition hover:bg-slate-800/80 ${selectedUser?.id === user.id ? "bg-slate-800/80" : ""}`}
                    onClick={() => setSelectedId(user.id)}
                  >
                    <td className="px-4 py-3">{user.nombre}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.company ?? "—"}</td>
                    <td className="px-4 py-3">{user.product === "stockflow_plus" ? "StockFlow+" : "StockFlow"}</td>
                    <td className="px-4 py-3 capitalize">{user.plan.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.trialEnabled ? (trial.isExpired ? "Vencida" : "Activa") : "No"}</td>
                    <td className="px-4 py-3">{trial.remainingDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Detalle administrativo</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{selectedUser.nombre}</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-2 text-white">{selectedUser.email}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Empresa</p>
              <p className="mt-2 text-white">{selectedUser.company ?? "Sin empresa"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fecha de registro</p>
              <p className="mt-2 text-white">{selectedUser.createdAt ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Producto</p>
              <p className="mt-2 text-white">{selectedUser.product === "stockflow_plus" ? "StockFlow+" : "StockFlow"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan</p>
              <p className="mt-2 text-white">{selectedUser.plan.replace("_", " ")}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</p>
              <p className="mt-2 text-white">{selectedUser.subscriptionStatus}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prueba</p>
              <p className="mt-2 text-white">{selectedUser.trialEnabled ? (getTrialSummaryForClient(selectedUser).isExpired ? "Vencida" : "Activa") : "Inactiva"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inicio</p>
              <p className="mt-2 text-white">{selectedUser.trialStartedAt ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Finalización</p>
              <p className="mt-2 text-white">{selectedUser.trialEndsAt ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Días transcurridos</p>
              <p className="mt-2 text-white">{getTrialSummaryForClient(selectedUser).elapsedDays}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Días restantes</p>
              <p className="mt-2 text-white">{getTrialSummaryForClient(selectedUser).remainingDays}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Medio de pago</p>
              <p className="mt-2 text-white">{selectedUser.paymentMethodStatus === "ready" ? "Registrado" : "Pendiente"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Renovación automática</p>
              <p className="mt-2 text-white">{selectedUser.autoRenew ? "Activada" : "Desactivada"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Descuento</p>
              <p className="mt-2 text-white">{selectedUser.discountPercent ?? 0}%</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Promoción</p>
              <p className="mt-2 text-white">{selectedUser.promotionId ?? "—"}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
