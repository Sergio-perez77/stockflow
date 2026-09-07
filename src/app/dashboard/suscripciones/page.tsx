"use client";

import { useEffect, useState } from "react";

import {
  getStoredSession,
  setStoredSession,
  updateUserPlan,
  type SessionUser,
  type SubscriptionPlan,
} from "@/lib/auth";

const planes = [
  {
    id: "demo",
    nombre: "Demo 15 min",
    precio: "Gratis",
    descripcion: "Prueba rápida para evaluar la operación básica.",
    features: ["Acceso de prueba", "15 minutos de uso", "Módulos esenciales"],
    destacado: false,
  },
  {
    id: "saas",
    nombre: "SaaS",
    precio: "$49/mes",
    descripcion: "Para negocios que necesitan gestión operativa moderna.",
    features: ["Productos y ventas", "Clientes y proveedores", "Reportes básicos"],
    destacado: true,
  },
  {
    id: "erp",
    nombre: "ERP",
    precio: "$129/mes",
    descripcion: "Para operaciones empresariales completas y multi-sucursal.",
    features: ["ERP avanzado", "Compras y stock", "Integraciones y control financiero"],
    destacado: false,
  },
] as const;

export default function SuscripcionesPage() {
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    setUsuario(getStoredSession());
  }, []);

  const seleccionarPlan = (planId: SubscriptionPlan) => {
    const actualizado = updateUserPlan(usuario, planId);
    setStoredSession(actualizado);
    setUsuario(actualizado);
    setMensaje(`Plan actualizado a ${planId.toUpperCase()}.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Suscripciones</h1>
        <p className="text-gray-400">
          Elegí el acceso que mejor se adapte a tu operación.
        </p>
      </div>

      <div className="rounded-xl border border-cyan-700/40 bg-cyan-950/20 p-5">
        <p className="text-sm text-cyan-300">Usuario actual</p>
        <p className="mt-2 text-xl font-semibold text-white">{usuario?.nombre ?? "Invitado"}</p>
        <p className="text-sm text-slate-300">Plan actual: {usuario?.plan ?? "demo"}</p>
      </div>

      {mensaje && (
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-4 text-sm text-emerald-300">
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-6 ${
              plan.destacado
                ? "border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/10"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{plan.nombre}</h2>
              {plan.destacado && (
                <span className="rounded-full bg-cyan-500 px-2 py-1 text-xs font-semibold uppercase text-slate-950">
                  Recomendado
                </span>
              )}
            </div>

            <p className="mt-4 text-3xl font-bold text-white">{plan.precio}</p>
            <p className="mt-3 text-sm text-slate-400">{plan.descripcion}</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => seleccionarPlan(plan.id as SubscriptionPlan)}
              className={`mt-8 w-full rounded-lg px-4 py-3 font-semibold transition ${
                usuario?.plan === plan.id
                  ? "bg-emerald-500 text-slate-950"
                  : plan.destacado
                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    : "border border-slate-700 bg-slate-800 text-white hover:border-cyan-500"
              }`}
            >
              {usuario?.plan === plan.id ? "Plan actual" : "Seleccionar plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
