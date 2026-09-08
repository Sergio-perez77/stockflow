import { getOwnerOverview, getOwnerUsers, getPromotionSummary, getTrialSummary } from "@/lib/owner";

const cards = [
  { label: "Usuarios totales", key: "totalUsers" },
  { label: "Usuarios activos", key: "activeUsers" },
  { label: "En período de prueba", key: "inTrialUsers" },
  { label: "Pruebas vencidas", key: "expiredTrials" },
  { label: "Pruebas por vencer", key: "trialsExpiringSoon" },
  { label: "Usuarios StockFlow", key: "stockflowUsers" },
  { label: "Usuarios StockFlow+", key: "stockflowPlusUsers" },
  { label: "Usuarios Plus", key: "plusUsers" },
] as const;

export default function OwnerPage() {
  const users = getOwnerUsers();
  const overview = getOwnerOverview(users);
  const promotionSummary = getPromotionSummary(users);
  const now = new Date();
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Resumen</p>
        <h2 className="mt-2 text-3xl font-bold text-white">STOCKFLOW OWNER</h2>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.key} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-white">{overview[card.key]}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Promoción actual</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Primeros 100 clientes</h3>
          <p className="mt-2 text-slate-300">
            {promotionSummary.first100Used} / 100 utilizados
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {promotionSummary.first100Remaining} restantes
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Próximas pruebas</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Vencimiento</h3>
          <p className="mt-2 text-slate-300">
            {users.filter((user) => user.role !== "owner" && user.trialEnabled).length} usuarios en prueba
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {users.filter((user) => user.role !== "owner" && user.trialEnabled && getTrialSummary(user).remainingDays <= 7).length} próximas a vencer
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Últimos usuarios</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 pr-4 font-medium">Nombre</th>
                <th className="py-3 pr-4 font-medium">Email</th>
                <th className="py-3 pr-4 font-medium">Producto</th>
                <th className="py-3 pr-4 font-medium">Plan</th>
                <th className="py-3 pr-4 font-medium">Prueba</th>
                <th className="py-3 pr-4 font-medium">Días restantes</th>
                <th className="py-3 pr-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-800 text-slate-200">
                  <td className="py-3 pr-4">{user.nombre}</td>
                  <td className="py-3 pr-4">{user.email}</td>
                  <td className="py-3 pr-4">{user.product === "stockflow_plus" ? "StockFlow+" : "StockFlow"}</td>
                  <td className="py-3 pr-4 capitalize">{user.plan.replace("_", " ")}</td>
                  <td className="py-3 pr-4">{user.trialEnabled ? "Activa" : "No"}</td>
                  <td className="py-3 pr-4">{user.trialEndsAt ? Math.max(0, Math.ceil((new Date(`${user.trialEndsAt}T00:00:00Z`).getTime() - now.getTime()) / 86400000)) : 0}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                      {user.subscriptionStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
