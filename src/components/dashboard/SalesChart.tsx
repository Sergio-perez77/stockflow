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

  const datosGrafico = ventas.reduce((acc, venta) => {
  const existente = acc.find(
    (p) => p.producto === venta.producto
  );

  if (existente) {
    existente.total += Number(venta.total);
  } else {
    acc.push({
      producto: venta.producto,
      total: Number(venta.total),
    });
  }

  return acc;
}, [] as { producto: string; total: number }[]);

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
                dataKey="producto"
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