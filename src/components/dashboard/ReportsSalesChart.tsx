"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import type { Venta } from "@/types/venta";

interface Props {
  ventas: Venta[];
}

export default function ReportsSalesChart({
  ventas,
}: Props) {

  const datos = ventas.reduce((acc, venta) => {

    const existente = acc.find(
      (d) => d.fecha === venta.fecha
    );

    if (existente) {
      existente.total += venta.total;
    } else {
      acc.push({
        fecha: venta.fecha,
        total: venta.total,
      });
    }

    return acc;

  }, [] as { fecha: string; total: number }[]);

  return (

    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

      <h2 className="text-xl font-bold mb-6">
        Ventas por día
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <LineChart data={datos}>

          <CartesianGrid stroke="#334155" />

          <XAxis dataKey="fecha" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="total"
            stroke="#06b6d4"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}