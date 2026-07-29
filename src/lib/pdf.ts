import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Venta } from "@/types/venta";

export function exportarVentasPDF(
  ventas: Venta[]
) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Reporte de Ventas", 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [[
      "Fecha",
      "Cliente",
      "Producto",
      "Cantidad",
      "Total",
    ]],
    body: ventas.map((venta) => [
      venta.fecha,
      venta.cliente,
      venta.producto,
      venta.cantidad,
      `$${venta.total}`,
    ]),
  });

  doc.save("reporte-ventas.pdf");
}