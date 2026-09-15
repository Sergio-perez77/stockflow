"use client";

import { useEffect, useState } from "react";

type SubscriptionState = {
  status: string;
  trialStartAt: string | null;
  trialEndAt: string | null;
  startedAt: string | null;
  daysRemaining: number;
  isBlocked: boolean;
  canAccessBilling: boolean;
  canUseProduct: boolean;
};

type BillingStateResponse = {
  ok: boolean;
  data?: {
    company?: { nombre?: string; status?: string };
    subscription?: {
      status?: string;
      productId?: string;
      planId?: string;
      trialStartAt?: string | null;
      trialEndAt?: string | null;
      startedAt?: string | null;
      priceAmount?: number;
      currency?: string;
    };
    state?: SubscriptionState;
    user?: { nombre?: string; email?: string };
    plan?: { name?: string; code?: string; amount?: number; currency?: string };
  };
  message?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function SuscripcionesPage() {
  const [data, setData] = useState<BillingStateResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSubscriptionState() {
      try {
        const response = await fetch("/api/billing/state", { credentials: "include" });
        const result = (await response.json()) as BillingStateResponse;
        if (!active) return;

        if (!response.ok || !result.ok || !result.data) {
          setError(result.message ?? "No se pudo cargar la suscripción.");
          setData(null);
          return;
        }

        setData(result.data);
      } catch {
        if (active) {
          setError("No se pudo cargar el estado de suscripción.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSubscriptionState();
    return () => { active = false; };
  }, []);

  const state = data?.state ?? { status: "trial", trialStartAt: null, trialEndAt: null, startedAt: null, daysRemaining: 0, isBlocked: false, canAccessBilling: true, canUseProduct: true };
  const subscription = data?.subscription ?? {};
  const company = data?.company ?? {};
  const plan = data?.plan ?? {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Suscripción</h1>
        <p className="text-gray-400">Estado real de la cuenta y el trial activo.</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300">Cargando estado de la suscripción…</div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="rounded-2xl border border-cyan-700/40 bg-cyan-950/20 p-5">
            <p className="text-sm text-cyan-300">Empresa</p>
            <p className="mt-2 text-2xl font-semibold text-white">{company.nombre ?? "Mi empresa"}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">Plan: {plan.name ?? plan.code ?? subscription.planId ?? "standard"}</span>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">Estado: {state.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan actual</p>
              <p className="mt-3 text-xl font-semibold text-white">{plan.name ?? plan.code ?? "Standard"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</p>
              <p className="mt-3 text-xl font-semibold text-white">{state.status}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inicio</p>
              <p className="mt-3 text-xl font-semibold text-white">{formatDate(state.trialStartAt ?? subscription.startedAt ?? null)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Días restantes</p>
              <p className="mt-3 text-xl font-semibold text-white">{state.daysRemaining}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-white">Detalles del trial</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
                  <dt>trialStartAt</dt>
                  <dd className="text-white">{formatDate(state.trialStartAt ?? subscription.trialStartAt ?? null)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
                  <dt>trialEndAt</dt>
                  <dd className="text-white">{formatDate(state.trialEndAt ?? subscription.trialEndAt ?? null)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
                  <dt>Próxima acción</dt>
                  <dd className="text-white">{state.isBlocked ? "Regularizar suscripción" : "Continuar con la cuenta activa"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-white">Estado del billing</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
                  <dt>Acceso al producto</dt>
                  <dd className="text-white">{state.canUseProduct ? "Permitido" : "Bloqueado"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
                  <dt>Billing</dt>
                  <dd className="text-white">{state.canAccessBilling ? "Disponible" : "Restringido"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
                  <dt>Proveedor</dt>
                  <dd className="text-white">Desarrollo / Noop</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
