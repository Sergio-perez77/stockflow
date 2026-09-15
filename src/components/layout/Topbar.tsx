"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ nombre?: string; email?: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        const data = await response.json();
        if (response.ok && data?.ok) {
          setUser(data.user ?? null);
        }
      } catch {
        setUser(null);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-gray-300 hover:text-cyan-400 transition">
          🔔
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-slate-900">
            {user?.nombre?.slice(0, 2).toUpperCase() ?? "SP"}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}