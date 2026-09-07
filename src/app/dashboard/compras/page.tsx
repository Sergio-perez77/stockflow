"use client";

import { useState } from "react";

import PurchaseModal from "@/components/dashboard/PurchaseModal";

import { useLocalStorage } from "@/hooks/useLocalStorage";

import type { Compra } from "@/types/compra";
import type { Producto } from "@/types/producto";

import CompraComprobanteModal from "@/components/dashboard/CompraComprobanteModal";

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

  const [buscarCompra, setBuscarCompra] = useState("");

  const [filtroProveedor, setFiltroProveedor] =
  useState("Todos");

  const [filtroEstado, setFiltroEstado] =
    useState("Todos");

  const [filtroMetodoPago, setFiltroMetodoPago] =
    useState("Todos");

  const [filtroFecha, setFiltroFecha] =
    useState("");

  const [compraSeleccionada, setCompraSeleccionada] =
  useState<Compra | null>(null);

  const [modalComprobante, setModalComprobante] =
    useState(false);


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

  function anularCompra(id: number) {

  const compra = compras.find((c) => c.id === id);

  if (!compra || compra.estado === "Anulada") return;

  const confirmar = window.confirm(
    `¿Deseás anular la compra ${compra.codigo}?`
  );

  if (!confirmar) return;

  setCompras(
    compras.map((c) =>
      c.id === id
        ? {
            ...c,
            estado: "Anulada",
          }
        : c
    )
  );

  setProductos(
    productos.map((producto) =>
      producto.nombre === compra.producto
        ? {
            ...producto,
            stock: Math.max(
              0,
              producto.stock - compra.cantidad
            ),
          }
        : producto
    )
  );

}

  const comprasFiltradas = compras.filter((compra) => {

  const coincideBusqueda =
    (compra.codigo ?? "")
      .toLowerCase()
      .includes(buscarCompra.toLowerCase()) ||

    (compra.proveedor ?? "")
      .toLowerCase()
      .includes(buscarCompra.toLowerCase()) ||

    (compra.producto ?? "")
      .toLowerCase()
      .includes(buscarCompra.toLowerCase());

  const coincideProveedor =
    filtroProveedor === "Todos" ||
    compra.proveedor === filtroProveedor;

  const coincideEstado =
    filtroEstado === "Todos" ||
    compra.estado === filtroEstado;

  const coincideMetodo =
    filtroMetodoPago === "Todos" ||
    compra.metodoPago === filtroMetodoPago;

  const coincideFecha =
    filtroFecha === "" ||
    compra.fecha === filtroFecha;

  return (
    coincideBusqueda &&
    coincideProveedor &&
    coincideEstado &&
    coincideMetodo &&
    coincideFecha
  );

});

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

        <div className="grid grid-cols-4 gap-4 mb-6">

            <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">
                    Compras
                  </p>

                  <p className="text-2xl font-bold">
                    {compras.length}
                  </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                  Total invertido
              </p>

              <p className="text-2xl font-bold text-cyan-400">
                  $
                  {compras.reduce(
                  (t, c) => t + c.costo,
                    0
                  )}
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                Pagadas
              </p>

              <p className="text-2xl font-bold text-green-400">
                {
                compras.filter(
                (c) => c.estado === "Pagada"
                ).length
                }
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  Pendientes
                </p>

                <p className="text-2xl font-bold text-yellow-400">
                  {
                    compras.filter(
                    (c) => c.estado === "Pendiente"
                    ).length
                  }
                </p>
              </div>

        </div>

        <input
          type="text"
          value={buscarCompra}
          onChange={(e) => setBuscarCompra(e.target.value)}
          placeholder="Buscar por código, proveedor o producto..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 mb-6"
        />

        <div className="flex flex-wrap gap-4 mb-6">

            <select
              value={filtroProveedor}
              onChange={(e) =>
                setFiltroProveedor(e.target.value)
              }
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
            >
              <option value="Todos">
                Todos los proveedores
              </option>

              {[...new Set(compras.map((c) => c.proveedor))].map(
                (proveedor) => (
                  <option
                    key={proveedor}
                    value={proveedor}
                  >
                    {proveedor}
                  </option>
                )
              )}

            </select>

            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value)
              }
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
            >
              <option>Todos</option>
              <option>Pagada</option>
              <option>Pendiente</option>
              <option>Anulada</option>
            </select>

            <select
              value={filtroMetodoPago}
              onChange={(e) =>
                setFiltroMetodoPago(e.target.value)
              }
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
            >
              <option>Todos</option>
              <option>Efectivo</option>
              <option>Débito</option>
              <option>Crédito</option>
              <option>Transferencia</option>
              <option>Mercado Pago</option>
              <option>Cuenta Corriente</option>
            </select>

            <input
              type="date"
              value={filtroFecha}
              onChange={(e) =>
                setFiltroFecha(e.target.value)
              }
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
            />

        </div>

      <div className="max-h-[600px] overflow-auto rounded-lg border border-slate-800">

        <table className="min-w-[1200px] w-full">

          <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 text-gray-400 z-10">

            <tr>
              <th className="px-4 pb-4 text-left min-w-[140px]">
                Código
              </th>

              <th className="px-4 pb-4 text-left min-w-[180px]">
                Proveedor
              </th>

              <th className="px-4 pb-4 text-left min-w-[120px]">
                Fecha
              </th>

              <th className="px-4 pb-4 text-left min-w-[150px]">
                Método
              </th>

              <th className="px-4 pb-4 text-left min-w-[220px]">
                Producto
              </th>

              <th className="px-4 pb-4 text-center min-w-[90px]">
                Cantidad
              </th>

              <th className="px-4 pb-4 text-right min-w-[120px]">
                Costo
              </th>

              <th className="px-4 pb-4 text-center min-w-[100px]">
                Estado
              </th>

              <th className="px-4 pb-4 text-center min-w-[150px]">
                Acciones
              </th>
            </tr>

          </thead>

          <tbody>

            {comprasFiltradas.map((compra) => (

              <tr
                  key={compra.id}
                  className="border-b border-slate-800"
                >
                  <td className="py-4">
                    {compra.codigo}
                  </td>

                  <td>
                    {compra.proveedor}
                  </td>

                  <td>
                    {compra.fecha}
                  </td>

                  <td>
                    {compra.metodoPago}
                  </td>

                  <td>
                    {compra.producto}
                  </td>

                  <td className="text-center">
                    {compra.cantidad}
                  </td>

                  <td className="text-right">
                    ${compra.costo}
                  </td>

                  <td className="text-center">
                    <span
                      className={
                        compra.estado === "Pagada"
                          ? "text-green-400 font-semibold"
                          : "text-yellow-400 font-semibold"
                      }
                      >
                      {compra.estado}
                    </span>
                  </td>

                  <td className="px-4 py-4 w-[170px]">

                    <div className="flex flex-col gap-2">

                      <button
                        onClick={() => {
                          setCompraSeleccionada(compra);
                          setModalComprobante(true);
                        }}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 py-2 rounded-lg text-sm"
                      >
                        Comprobante
                      </button>

                      {compra.estado !== "Anulada" && (

                        <button
                          onClick={() => anularCompra(compra.id)}
                          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm"
                        >
                          Anular
                        </button>

                      )}

                    </div>

                  </td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

      </div>

      <PurchaseModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={guardarCompra}
      />

      <CompraComprobanteModal
        open={modalComprobante}
        onClose={() => setModalComprobante(false)}
        compra={compraSeleccionada}
      />
    </>
  );
}