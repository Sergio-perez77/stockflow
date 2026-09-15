"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getSubscriptionStatusSummary } from "@/lib/subscription-ui";

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

type BillingResponse = {
  ok: boolean;
  data?: {
    company?: { nombre?: string; status?: string };
    subscription?: {
      status?: string;
      trialStartAt?: string | null;
      trialEndAt?: string | null;
      startedAt?: string | null;
      productId?: string | null;
      planId?: string | null;
      currency?: string | null;
    };
    plan?: { name?: string; code?: string };
    state?: SubscriptionState;
    user?: { nombre?: string; email?: string };
  };
  message?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

export default function SubscriptionStatusCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BillingResponse["data"] | null>(null);

  useEffect(() => {
    let active = true;

    async function loadState() {
      try {
        const response = await fetch("/api/billing/state", { credentials: "include" });
        const result = (await response.json()) as BillingResponse;

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
            setError(result.message ?? "No se pudo cargar el estado de la cuenta.");
          }
          setData(null);
          return;
        }

        setData(result.data);
      } catch {
        if (!active) return;
        setError("No se pudo cargar el estado de la cuenta.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadState();
    return () => { active = false; };
  }, []);

  const planName = data?.plan?.name ?? data?.plan?.code ?? "StockFlow";
  const state = data?.state ?? {
    status: "trial",
    trialStartAt: data?.subscription?.trialStartAt ?? null,
    trialEndAt: data?.subscription?.trialEndAt ?? null,
    startedAt: data?.subscription?.startedAt ?? null,
    daysRemaining: 30,
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

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-300">
        Cargando estado de la cuenta…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-200">
        <p className="font-semibold">No se pudo cargar tu estado de cuenta.</p>
        <p className="mt-2 text-sm text-red-100">{error}</p>
      </div>
    );
  }

  const isTrial = state.status === "trial";
  const isWarning = summary.highlight || isTrial;

  return (
    <div className={`rounded-2xl border p-5 ${isWarning ? "border-amber-500/40 bg-amber-950/20" : "border-slate-800 bg-slate-900"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cuenta</p>
          <h2 className="mt-3 text-2xl font-bold text-white">{planName}</h2>
          <p className="mt-2 text-sm text-slate-300">{data?.company?.nombre ?? "Mi empresa"}</p>
        </div>

        <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-200">
          {summary.label}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm text-slate-300">{summary.message}</p>

        {isTrial && (
          <div className="mt-4 space-y-2 text-sm text-slate-200">
            <p>Te quedan {summary.daysRemaining} días.</p>
            <p>Tu prueba finaliza el {summary.finalDateText}.</p>
          </div>
        )}

        {state.status === "active" && (
          <div className="mt-4 text-sm text-slate-200">
            <p>Plan actual: {planName}</p>
            <p>Inicio: {formatDate(state.startedAt ?? data?.subscription?.startedAt ?? null)}</p>
          </div>
        )}

        {state.status === "expired" && (
          <div className="mt-4 text-sm text-slate-200">
            <p>Tu período de prueba terminó.</p>
            <p>Elegí un plan para continuar utilizando StockFlow.</p>
          </div>
        )}

        {state.status === "suspended" && (
          <div className="mt-4 text-sm text-slate-200">
            <p>El acceso está restringido hasta regularizar la cuenta.</p>
          </div>
        )}

        {state.status === "past_due" && (
          <div className="mt-4 text-sm text-slate-200">
            <p>Hay un pago pendiente.</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {summary.actionLabel && (
          <Link
            href="/dashboard/suscripcion"
            className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {summary.actionLabel}
          </Link>
        )}

        <Link
          href="/dashboard/suscripcion"
          className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
        >
          Ver detalle
        </Link>
      </div>
    </div>
  );
}
