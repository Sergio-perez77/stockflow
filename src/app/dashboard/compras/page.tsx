"use client";

import { useState } from "react";

import PurchaseModal from "@/components/dashboard/PurchaseModal";

import { useLocalStorage } from "@/hooks/useLocalStorage";

import type { Compra } from "@/types/compra";
import type { Producto } from "@/types/producto";

export default function ComprasPage() {
  const {
    datos: compras,
    setDatos: setCompras,
  } = useLocalStorage<Compra>("compras");

  const {
    datos: productos,
    setDatos: setProductos,
  } = useLocalStorage<Producto>("productos");

  const [openModal, setOpenModal] = useState(false);

  function guardarCompra(compra: Omit<Compra, "id">) {
    setCompras([
      ...compras,
      {
        id: Date.now(),
        ...compra,
      },
    ]);

    setProductos(
      productos.map((producto) =>
        producto.nombre === compra.producto
          ? {
              ...producto,
              stock: producto.stock + compra.cantidad,
            }
          : producto
      )
    );

    setOpenModal(false);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">

        <h1 className="text-4xl font-bold text-white">
          Compras
        </h1>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 px-5 py-3 rounded-lg font-semibold"
        >
          + Nueva compra
        </button>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

        <table className="w-full">

          <thead className="border-b border-slate-700 text-gray-400">

            <tr>
              <th className="text-left pb-4">Producto</th>
              <th className="text-left pb-4">Proveedor</th>
              <th className="text-left pb-4">Cantidad</th>
              <th className="text-left pb-4">Costo</th>
              <th className="text-left pb-4">Fecha</th>
            </tr>

          </thead>

          <tbody>

            {compras.map((compra) => (

              <tr
                key={compra.id}
                className="border-b border-slate-800"
              >
                <td className="py-4">
                  {compra.producto}
                </td>

                <td>{compra.proveedor}</td>

                <td>{compra.cantidad}</td>

                <td>${compra.costo}</td>

                <td>{compra.fecha}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <PurchaseModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={guardarCompra}
      />
    </>
  );
}