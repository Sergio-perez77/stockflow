"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Producto } from "@/types/producto";

export default function RecentProducts() {
  const { datos: productos } =
    useLocalStorage<Producto>("productos");

  const productosRecientes = [...productos]
    .reverse()
    .slice(0, 5);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">

      <h2 className="text-xl font-semibold mb-6">
        Productos recientes
      </h2>

      <div className="space-y-4">

        {productosRecientes.length === 0 ? (
          <p className="text-gray-400">
            No hay productos cargados.
          </p>
        ) : (
          productosRecientes.map((producto) => (
            <div
              key={producto.id}
              className="flex justify-between items-center border-b border-slate-800 pb-3"
            >
              <div>
                <p className="font-medium">
                  {producto.nombre}
                </p>

                <p className="text-sm text-gray-400">
                  Stock: {producto.stock}
                </p>
              </div>

              <span className="text-cyan-400 font-semibold">
                {producto.precio}
              </span>
            </div>
          ))
        )}

      </div>

    </div>
  );
}