"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Producto } from "@/types/producto";
import type { Cliente } from "@/types/cliente";
import type { Proveedor } from "@/types/proveedor";
import type { Venta } from "@/types/venta";

export default function RecentActivity() {
  const { datos: productos } =
    useLocalStorage<Producto>("productos");

  const { datos: clientes } =
    useLocalStorage<Cliente>("clientes");

  const { datos: proveedores } =
    useLocalStorage<Proveedor>("proveedores");

  const { datos: ventas } =
    useLocalStorage<Venta>("ventas");

  const actividades = [
    ...productos.map((p) => ({
      id: `producto-${p.id}`,
      titulo: "Producto agregado",
      descripcion: p.nombre,
    })),

    ...clientes.map((c) => ({
      id: `cliente-${c.id}`,
      titulo: "Cliente agregado",
      descripcion: c.nombre,
    })),

    ...proveedores.map((p) => ({
      id: `proveedor-${p.id}`,
      titulo: "Proveedor agregado",
      descripcion: p.empresa,
    })),

    ...ventas.map((v) => ({
      id: `venta-${v.id}`,
      titulo: "Venta registrada",
      descripcion: `${v.producto} - $${v.total}`,
    })),
  ]
    .reverse()
    .slice(0, 10);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mt-8">

      <h2 className="text-2xl font-bold mb-6 text-white">
        Actividad reciente
      </h2>

      <div className="space-y-4">

        {actividades.length === 0 ? (
          <p className="text-gray-400">
            No hay actividad registrada.
          </p>
        ) : (
          actividades.map((actividad) => (
            <div
              key={actividad.id}
              className="flex justify-between items-center border-b border-slate-800 pb-4"
            >
              <div>
                <p className="font-semibold text-white">
                  {actividad.titulo}
                </p>

                <p className="text-gray-400 text-sm">
                  {actividad.descripcion}
                </p>
              </div>
            </div>
          ))
        )}

      </div>

    </div>
  );
}