"use client";

import { useEffect, useMemo, useState } from "react";

import { getPromotionSummaryForClient } from "@/lib/owner-client";
import type { OwnerUserRecord } from "@/lib/owner-types";

export default function OwnerPromocionesPage() {
  const [users, setUsers] = useState<OwnerUserRecord[]>([]);

  useEffect(() => {
    fetch("/api/owner/users")
      .then((response) => response.json())
      .then((payload) => {
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setUsers(data.filter((user: OwnerUserRecord) => user.role !== "owner"));
      })
      .catch(() => setUsers([]));
  }, []);

  const summary = useMemo(() => getPromotionSummaryForClient(users), [users]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Promociones</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Promociones y descuentos</h2>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Promoción 1</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Primeros 100 clientes</h3>
          <p className="mt-2 text-slate-300">Beneficio: 30 días gratis</p>
          <p className="mt-2 text-3xl font-bold text-white">{summary.first100Used} / 100</p>
          <p className="mt-1 text-sm text-slate-400">{summary.first100Remaining} restantes</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Promoción 2</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Siguientes 100 clientes</h3>
          <p className="mt-2 text-slate-300">Beneficio: 50% de descuento</p>
          <p className="mt-2 text-3xl font-bold text-white">{summary.second100Used} / 100</p>
          <p className="mt-1 text-sm text-slate-400">{summary.second100Remaining} restantes</p>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold text-white">Asignación por registro</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Promoción</th>
                <th className="px-4 py-3 font-medium">Plan</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 10).map((user, index) => (
                <tr key={user.id} className="border-b border-slate-800 text-slate-200">
                  <td className="px-4 py-3">{user.nombre}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{summary.promoForUserIndex(index)}</td>
                  <td className="px-4 py-3 capitalize">{user.plan.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
