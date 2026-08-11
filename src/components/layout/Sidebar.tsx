import Link from "next/link";
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

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 text-white">

      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-cyan-400">
          StockFlow
        </h1>
      </div>

      <nav className="p-4">

        <ul className="space-y-2">

          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/productos"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <Package size={20} />
              Productos
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/clientes"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <Users size={20} />
              Clientes
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/proveedores"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <Truck size={20} />
              Proveedores
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/compras"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <ShoppingCart size={20} />
              Compras
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/ventas"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <DollarSign size={20} />
              Ventas
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/reportes"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <BarChart3 size={20} />
              Reportes
            </Link>
          </li>


          <li>
            <Link
              href="/dashboard/configuracion"
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
            >
              <Settings size={20} />
              Configuración
            </Link>
          </li>

        </ul>

      </nav>

    </aside>
  );
}