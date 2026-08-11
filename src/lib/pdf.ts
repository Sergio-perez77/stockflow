import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Venta } from "@/types/venta";

import type { Producto } from "@/types/producto";
import type { Cliente } from "@/types/cliente";

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
      "Productos",
      "Cantidad",
      "Total",
    ]],

    body: ventas.map((venta) => [

      venta.fecha,

      venta.cliente,

      venta.items
        .map((item) => item.producto)
        .join(", "),

      venta.items.reduce(
        (t, item) => t + item.cantidad,
        0
      ),

      `$${venta.total}`,

    ]),

  });

  doc.save("reporte-ventas.pdf");

}

export function exportarProductosPDF(
  productos: Producto[]
) {

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Reporte de Productos", 14, 20);

  autoTable(doc, {

    startY: 30,

    head: [[
      "Producto",
      "Categoría",
      "Precio",
      "Stock",
    ]],

    body: productos.map((producto) => [

      producto.nombre,

      producto.categoria,

      producto.precio,

      producto.stock,

    ]),

  });

  doc.save("reporte-productos.pdf");

}

export function exportarClientesPDF(
  clientes: Cliente[]
) {

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Reporte de Clientes", 14, 20);

  autoTable(doc, {

    startY: 30,

    head: [[
      "Nombre",
      "Email",
      "Teléfono",
      "Dirección",
    ]],

    body: clientes.map((cliente) => [

      cliente.nombre,

      cliente.email,

      cliente.telefono,


    ]),

  });

  doc.save("reporte-clientes.pdf");

}