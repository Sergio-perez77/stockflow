import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionCookieValue, isOwnerRole } from "@/lib/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = getSessionCookieValue(cookieStore.get("stockflow_session")?.value ?? null);

  if (!session || !isOwnerRole(session)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-400">StockFlow</p>
            <h1 className="mt-1 text-2xl font-bold">Owner</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:block">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-400">Owner Panel</p>
          <nav className="space-y-2">
            <Link href="/owner" className="block rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">Resumen</Link>
            <Link href="/owner/usuarios" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Usuarios</Link>
            <Link href="/owner/pruebas" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Pruebas</Link>
            <Link href="/owner/promociones" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Promociones</Link>
            <Link href="/owner/plus" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">StockFlow+</Link>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
