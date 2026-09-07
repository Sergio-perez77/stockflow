"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Venta } from "@/types/venta";

export default function RecentOrders() {
  const { datos: ventas } =
    useLocalStorage<Venta>("ventas");

  const ventasRecientes = [...ventas]
    .reverse()
    .slice(0, 5);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mt-8">

      <h2 className="text-2xl font-bold mb-6 text-white">
        Ventas recientes
      </h2>

      <table className="w-full">

        <thead className="text-gray-400 border-b border-slate-700">
          <tr>
            <th className="text-left pb-3">ID</th>
            <th className="text-left pb-3">Producto</th>
            <th className="text-left pb-3">Cantidad</th>
            <th className="text-left pb-3">Total</th>
            <th className="text-left pb-3">Fecha</th>
          </tr>
        </thead>

        <tbody>

          {ventasRecientes.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-6 text-center text-gray-400"
              >
                No hay ventas registradas.
              </td>
            </tr>
          ) : (
            ventasRecientes.map((venta) => {
              const nombreProducto =
                venta.items.length === 0
                  ? "Sin productos"
                  : venta.items.length === 1
                    ? venta.items[0].producto
                    : `${venta.items.length} productos`;

              const cantidadTotal = venta.items.reduce(
                (total, item) => total + item.cantidad,
                0
              );

              return (
                <tr key={venta.id} className="border-b border-slate-800">
                  <td className="py-4">#{venta.id}</td>
                  <td>{nombreProducto}</td>
                  <td>{cantidadTotal}</td>
                  <td>${venta.total}</td>
                  <td>{venta.fecha}</td>
                </tr>
              );
            })
          )}

        </tbody>

      </table>

    </div>
  );
}