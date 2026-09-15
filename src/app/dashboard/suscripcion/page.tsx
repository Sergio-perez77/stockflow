"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getSubscriptionStatusSummary, getDaysRemaining } from "@/lib/subscription-ui";

type BillingStateResponse = {
  ok: boolean;
  data?: {
    company?: { id?: string; nombre?: string; status?: string };
    subscription?: {
      id?: string;
      status?: string;
      planId?: string | null;
      productId?: string | null;
      trialStartAt?: string | null;
      trialEndAt?: string | null;
      startedAt?: string | null;
      priceAmount?: number;
      currency?: string;
    };
    plan?: { id?: string; code?: string; name?: string; amount?: number; currency?: string };
    state?: {
      status?: string;
      trialStartAt?: string | null;
      trialEndAt?: string | null;
      startedAt?: string | null;
      daysRemaining?: number;
      isBlocked?: boolean;
      canAccessBilling?: boolean;
      canUseProduct?: boolean;
    };
    user?: { id?: string; nombre?: string; email?: string };
  };
  message?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

const PRODUCT_PLANS = [
  { code: "stockflow", name: "StockFlow" },
  { code: "stockflow_plus", name: "StockFlow+" },
];

export default function DashboardSubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<BillingStateResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/billing/state", { credentials: "include" });
        const result = (await response.json()) as BillingStateResponse;

        if (!active) return;

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok || !result.ok || !result.data) {
          if (response.status === 403) {
            setError("Acceso no autorizado.");
          } else if (response.status === 404) {
            setError("Estado de cuenta no disponible.");
          } else if (response.status >= 500) {
            setError("Hubo un error al consultar el estado de tu cuenta. Intentalo más tarde.");
          } else {
            setError(result.message ?? "No se pudo cargar la información de la cuenta.");
          }
          setData(null);
          return;
        }

        setData(result.data);
      } catch {
        if (active) {
          setError("No se pudo cargar la información de la cuenta.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const displayPlan = data?.plan?.name ?? data?.plan?.code ?? "StockFlow";
  const state = data?.state ?? {
    status: "trial",
    trialStartAt: data?.subscription?.trialStartAt ?? null,
    trialEndAt: data?.subscription?.trialEndAt ?? null,
    startedAt: data?.subscription?.startedAt ?? null,
    daysRemaining: getDaysRemaining(data?.subscription?.trialEndAt ?? null),
    isBlocked: false,
    canAccessBilling: true,
    canUseProduct: true,
  };

  const summary = useMemo(
    () => getSubscriptionStatusSummary({
      status: state.status,
      trialStartAt: state.trialStartAt,
      trialEndAt: state.trialEndAt,
      startedAt: state.startedAt,
    }),
    [state],
  );

  const productName = data?.subscription?.productId ? "StockFlow" : "StockFlow";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Suscripción</h1>
        <p className="text-gray-400">Información de tu plan y estado de billing.</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300">Cargando suscripción…</div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-red-200">
          <p className="font-semibold">Estado de cuenta no disponible.</p>
          <p className="mt-2 text-sm text-red-100">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Producto</p>
                <h2 className="mt-2 text-3xl font-bold text-white">{productName}</h2>
              </div>

              <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-200">
                {summary.label}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-300">{summary.message}</p>

              {state.status === "trial" && (
                <div className="mt-3 space-y-1 text-sm text-slate-200">
                  <p>Te quedan {summary.daysRemaining} días.</p>
                  <p>Tu prueba finaliza el {summary.finalDateText}.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan</p>
              <p className="mt-3 text-xl font-semibold text-white">{displayPlan}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</p>
              <p className="mt-3 text-xl font-semibold text-white">{state.status}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inicio trial</p>
              <p className="mt-3 text-xl font-semibold text-white">{formatDate(state.trialStartAt ?? data.subscription?.trialStartAt ?? null)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Días restantes</p>
              <p className="mt-3 text-xl font-semibold text-white">{summary.daysRemaining}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-white">Información de la cuenta</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Empresa</dt>
                  <dd className="text-white">{data.company?.nombre ?? "Mi empresa"}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Usuario</dt>
                  <dd className="text-white">{data.user?.nombre ?? "Usuario"}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Email</dt>
                  <dd className="text-white">{data.user?.email ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Finalización del trial</dt>
                  <dd className="text-white">{formatDate(state.trialEndAt ?? data.subscription?.trialEndAt ?? null)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold text-white">Estado de billing</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Acceso al producto</dt>
                  <dd className="text-white">{state.canUseProduct ? "Permitido" : "Restringido"}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Billing disponible</dt>
                  <dd className="text-white">{state.canAccessBilling ? "Sí" : "No"}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Plan actual</dt>
                  <dd className="text-white">{displayPlan}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <dt>Proveedor</dt>
                  <dd className="text-white">Desarrollo / Noop</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Planes disponibles</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRODUCT_PLANS.map((plan) => (
                <div key={plan.code} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <p className="text-lg font-semibold text-white">{plan.name}</p>
                  <p className="mt-2 text-sm text-slate-400">Plan base de StockFlow preparado para conexión futura con catálogo real.</p>
                  <div className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">Catalogado</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              Los pagos estarán disponibles próximamente. Por ahora la suscripción se gestiona en la capa SaaS sin integrar un proveedor real.
            </div>
          </div>

          <div className="flex justify-start">
            <Link href="/dashboard" className="inline-flex items-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300">
              Volver al dashboard
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
