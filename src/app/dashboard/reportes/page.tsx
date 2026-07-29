"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { exportarVentasPDF } from "@/lib/pdf";

import type { Venta } from "@/types/venta";
import type { Producto } from "@/types/producto";
import type { Cliente } from "@/types/cliente";

import { useState } from "react";

export default function ReportesPage() {

  const {
  datos: ventas,
} = useLocalStorage<Venta>("ventas");

  const {
    datos: productos,
  } = useLocalStorage<Producto>("productos");

  const {
    datos: clientes,
  } = useLocalStorage<Cliente>("clientes");

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cliente, setCliente] = useState("Todos");
  const [producto, setProducto] = useState("Todos");

  const ventasFiltradas = ventas.filter((venta) => {
  const cumpleCliente =
    cliente === "Todos" || venta.cliente === cliente;

  const cumpleProducto =
    producto === "Todos" || venta.producto === producto;

  const cumpleDesde =
    !desde || venta.fecha >= desde;

  const cumpleHasta =
    !hasta || venta.fecha <= hasta;

  return (
    cumpleCliente &&
    cumpleProducto &&
    cumpleDesde &&
    cumpleHasta
  );
});


  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-8">
        Reportes
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

  <input
    type="date"
    value={desde}
    onChange={(e) => setDesde(e.target.value)}
    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
  />

  <input
    type="date"
    value={hasta}
    onChange={(e) => setHasta(e.target.value)}
    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
  />

  <select
    value={cliente}
    onChange={(e) => setCliente(e.target.value)}
    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
  >
    <option>Todos</option>

    {clientes.map((cliente) => (
      <option
        key={cliente.id}
        value={cliente.nombre}
      >
        {cliente.nombre}
      </option>
    ))}

  </select>

  <select
    value={producto}
    onChange={(e) => setProducto(e.target.value)}
    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
  >
    <option>Todos</option>

    {productos.map((producto) => (
      <option
        key={producto.id}
        value={producto.nombre}
      >
        {producto.nombre}
      </option>
    ))}

  </select>

</div>

        <button
          onClick={() => exportarVentasPDF(ventasFiltradas)}
          className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-cyan-500 transition"
        >
          <h2 className="text-xl font-bold mb-3">
            Reporte de ventas
          </h2>

          <p className="text-gray-400">
            Exportar historial de ventas.
          </p>
        </button>

        <button className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-cyan-500 transition">

          <h2 className="text-xl font-bold mb-3">
            Reporte de productos
          </h2>

          <p className="text-gray-400">
            Exportar inventario completo.
          </p>

        </button>

        <button className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-cyan-500 transition">

          <h2 className="text-xl font-bold mb-3">
            Reporte de clientes
          </h2>

          <p className="text-gray-400">
            Exportar clientes registrados.
          </p>

        </button>

      </div>
    </>
  );
}