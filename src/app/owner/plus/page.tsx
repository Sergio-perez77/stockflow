"use client";

import { useEffect, useState } from "react";

import type { OwnerUserRecord } from "@/lib/owner-types";

export default function OwnerPlusPage() {
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

  const updateUser = async (userId: string, plan: "plus" | "standard", product: "stockflow_plus" | "stockflow", status: "active" | "suspended") => {
    setLoading(true);
    try {
      await fetch(`/api/owner/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, product, subscriptionStatus: status }),
      });
      await loadUsers();
    } finally {
      setLoading(false);
    }
  };

  const plusUsers = users.filter((user) => user.product === "stockflow_plus" || user.plan === "plus");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">StockFlow+</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Gestión de usuarios Plus</h2>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Usuarios StockFlow+</p>
          <p className="mt-3 text-3xl font-bold text-white">{plusUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Activos</p>
          <p className="mt-3 text-3xl font-bold text-white">{plusUsers.filter((user) => user.subscriptionStatus === "active").length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Suspendidos</p>
          <p className="mt-3 text-3xl font-bold text-white">{plusUsers.filter((user) => user.subscriptionStatus === "suspended").length}</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Descuento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plusUsers.map((user) => (
                <tr key={user.id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-4 py-3">{user.nombre}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.company ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{user.plan.replace("_", " ")}</td>
                  <td className="px-4 py-3">{user.discountPercent ?? 0}%</td>
                  <td className="px-4 py-3">{user.subscriptionStatus}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={loading} onClick={() => updateUser(user.id, "plus", "stockflow_plus", "active")} className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-50">Activar Plus</button>
                      <button type="button" disabled={loading} onClick={() => updateUser(user.id, "plus", "stockflow_plus", "suspended")} className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50">Desactivar Plus</button>
                      <button type="button" disabled={loading} onClick={() => updateUser(user.id, "standard", "stockflow", "active")} className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50">Cambiar plan</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
