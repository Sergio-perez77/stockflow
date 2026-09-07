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

const datos = ventas
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