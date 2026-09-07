"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  exportarVentasPDF,
  exportarProductosPDF,
  exportarClientesPDF,
} from "@/lib/pdf";

import type { Venta } from "@/types/venta";
import type { Producto } from "@/types/producto";
import type { Cliente } from "@/types/cliente";

import ReportsSalesChart from "@/components/dashboard/ReportsSalesChart";

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

  function normalizarFecha(fecha: string) {

  if (fecha.includes("-")) return fecha;

  const partes = fecha.split("/");

  if (partes.length !== 3) return fecha;

  const [dia, mes, anio] = partes;

  return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

}

  const ventasFiltradas = ventas.filter((venta) => {
    const cumpleEstado = venta.estado !== "Anulada";
  const cumpleCliente =
    cliente === "Todos" || venta.cliente === cliente;

  const cumpleProducto =
  producto === "Todos" ||
  venta.items.some(
    (item) => item.producto === producto
  );

  const fechaVenta = normalizarFecha(venta.fecha);

  const cumpleDesde =
    !desde || fechaVenta >= desde;

  const cumpleHasta =
    !hasta || fechaVenta <= hasta;

  return (
    cumpleEstado &&
    cumpleCliente &&
    cumpleProducto &&
    cumpleDesde &&
    cumpleHasta
  );
});

  const totalVentas = ventasFiltradas.reduce(
  (total, venta) => total + venta.total,
  0
);

const cantidadVentas = ventasFiltradas.length;

const unidadesVendidas = ventasFiltradas.reduce(
  (total, venta) =>
    total +
    venta.items.reduce(
      (subtotal, item) => subtotal + item.cantidad,
      0
    ),
  0
);

const ticketPromedio =
  cantidadVentas === 0
    ? 0
    : totalVentas / cantidadVentas;


  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-8">
        Reportes
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <p className="text-gray-400 text-sm">
              Total vendido
            </p>

            <h2 className="text-3xl font-bold text-green-400 mt-2">
              ${totalVentas}
            </h2>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <p className="text-gray-400 text-sm">
              Ventas
            </p>

            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              {cantidadVentas}
            </h2>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <p className="text-gray-400 text-sm">
              Unidades vendidas
            </p>

            <h2 className="text-3xl font-bold text-yellow-400 mt-2">
              {unidadesVendidas}
            </h2>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <p className="text-gray-400 text-sm">
              Ticket promedio
            </p>

            <h2 className="text-3xl font-bold text-purple-400 mt-2">
              ${ticketPromedio.toFixed(2)}
            </h2>

          </div>

      </div>

      

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



      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

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

        <button
          onClick={() =>
            exportarProductosPDF(productos)
          }
          className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-cyan-500 transition"
        >

          <h2 className="text-xl font-bold mb-3">
            Reporte de productos
          </h2>

          <p className="text-gray-400">
            Exportar inventario completo.
          </p>

        </button>

        <button
          onClick={() =>
            exportarClientesPDF(clientes)
          }
          className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-cyan-500 transition"
        >

          <h2 className="text-xl font-bold mb-3">
            Reporte de clientes
          </h2>

          <p className="text-gray-400">
            Exportar clientes registrados.
          </p>

        </button>

      </div>

      <div className="h-8" />
          <ReportsSalesChart
            ventas={ventasFiltradas}
          />

      

          
    </>
  );
}