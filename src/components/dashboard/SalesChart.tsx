"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Venta } from "@/types/venta";

export default function SalesChart() {
  const { datos: ventas } =
    useLocalStorage<Venta>("ventas");

  function normalizarFecha(fecha: string) {
  if (fecha.includes("-")) {
    return fecha;
  }

  const partes = fecha.split("/");

  if (partes.length !== 3) {
    return fecha;
  }

  const [dia, mes, anio] = partes;

  return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

const datosGrafico = ventas
  .filter((venta) => venta.estado !== "Anulada")
  .reduce((acumulado, venta) => {
    const fecha = normalizarFecha(venta.fecha);

    const existente = acumulado.find(
      (dato) => dato.fecha === fecha
    );

    if (existente) {
      existente.total += venta.total;
    } else {
      acumulado.push({
        fecha,
        total: venta.total,
      });
    }

    return acumulado;
  }, [] as { fecha: string; total: number }[])
  .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">

      <h2 className="text-xl font-semibold mb-6">
        Ventas realizadas
      </h2>

      <div className="h-80">

        {datosGrafico.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No hay ventas registradas.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={datosGrafico}>

              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="fecha"
                stroke="#94a3b8"
              />

              <YAxis
                stroke="#94a3b8"
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="total"
                stroke="#22d3ee"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>
        )}

      </div>

    </div>
  );
}