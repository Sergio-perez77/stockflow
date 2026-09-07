"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authenticate, getStoredSession, getUsers, setStoredSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@stockflow.com");
  const [password, setPassword] = useState("stockflow123");
  const [error, setError] = useState("");

  useEffect(() => {
    if (getStoredSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const usuario = authenticate(email, password, getUsers());

    if (!usuario) {
      setError("Credenciales inválidas. Probá con admin@stockflow.com / stockflow123");
      return;
    }

    setStoredSession(usuario);
    router.replace("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">StockFlow</p>
          <h1 className="mt-3 text-3xl font-bold">Iniciar sesión</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              placeholder="admin@stockflow.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Entrar al panel
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Demo admin: <span className="font-medium text-slate-200">admin@stockflow.com</span> / <span className="font-medium text-slate-200">stockflow123</span>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
