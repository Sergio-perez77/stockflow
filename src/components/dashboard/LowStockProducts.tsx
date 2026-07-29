"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Producto } from "@/types/producto";

export default function LowStockProducts() {
  const { datos: productos } =
    useLocalStorage<Producto>("productos");

  const stockBajo = productos.filter(
    (producto) => producto.stock <= 5
  );

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">

      <h2 className="text-xl font-semibold mb-6">
        Stock bajo
      </h2>

      {stockBajo.length === 0 ? (
        <p className="text-gray-400">
          No hay productos con stock bajo.
        </p>
      ) : (
        <div className="space-y-4">

          {stockBajo.map((producto) => (
            <div
              key={producto.id}
              className="flex justify-between border-b border-slate-800 pb-3"
            >
              <div>
                <p className="font-semibold">
                  {producto.nombre}
                </p>

                <p className="text-sm text-gray-400">
                  {producto.categoria}
                </p>
              </div>

              <span className="text-red-400 font-bold">
                {producto.stock}
              </span>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}