"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Settings,
} from "lucide-react";

import { canAccessFeature, getStoredSession, type FeatureKey } from "@/lib/auth";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  feature: FeatureKey;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, feature: "dashboard" },
  { href: "/dashboard/productos", label: "Productos", icon: Package, feature: "productos" },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users, feature: "clientes" },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users, feature: "usuarios" },
  { href: "/dashboard/suscripciones", label: "Suscripciones", icon: DollarSign, feature: "suscripciones" },
  { href: "/dashboard/proveedores", label: "Proveedores", icon: Truck, feature: "proveedores" },
  { href: "/dashboard/compras", label: "Compras", icon: ShoppingCart, feature: "compras" },
  { href: "/dashboard/ventas", label: "Ventas", icon: DollarSign, feature: "ventas" },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3, feature: "reportes" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, feature: "configuracion" },
];

export default function Sidebar() {
  const session = getStoredSession();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 text-white">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-cyan-400">StockFlow</h1>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {NAV_ITEMS.filter((item) => canAccessFeature(session, item.feature)).map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
