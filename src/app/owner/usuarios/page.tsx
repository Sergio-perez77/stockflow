import { getOwnerUsers, getTrialSummary } from "@/lib/owner";

export default function OwnerUsersPage() {
  const users = getOwnerUsers().filter((user) => user.role !== "owner");

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
                <th className="px-4 py-3 font-medium">Fecha de registro</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Prueba</th>
                <th className="px-4 py-3 font-medium">Días transcurridos</th>
                <th className="px-4 py-3 font-medium">Días restantes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const trial = getTrialSummary(user);

                return (
                  <tr key={user.id} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3">{user.nombre}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.company ?? "—"}</td>
                    <td className="px-4 py-3">{user.createdAt || "—"}</td>
                    <td className="px-4 py-3">{user.product === "stockflow_plus" ? "StockFlow+" : "StockFlow"}</td>
                    <td className="px-4 py-3 capitalize">{user.plan.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.trialEnabled ? (trial.isExpired ? "Vencida" : "Activa") : "No"}</td>
                    <td className="px-4 py-3">{trial.elapsedDays}</td>
                    <td className="px-4 py-3">{trial.remainingDays}</td>
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
