import type { Producto } from "@/types/producto";
import type { Venta, ItemVenta } from "@/types/venta";

import { convertirNumero } from "@/lib/numeros";

export function calcularSubtotal(
  producto: Producto,
  cantidad: number
) {
  return convertirNumero(producto.precio) * cantidad;
}

export function hayStock(
  producto: Producto,
  cantidad: number
) {
  return producto.stock >= cantidad;
}

export function descontarStock(
  productos: Producto[],
  items: ItemVenta[]
) {
  return productos.map((producto) => {
    const item = items.find(
      (i) => i.productoId === producto.id
    );

    if (!item) return producto;

    return {
      ...producto,
      stock: producto.stock - item.cantidad,
    };
  });
}

export function calcularTotal(
  items: ItemVenta[]
) {
  return items.reduce(
    (total, item) => total + item.subtotal,
    0
  );
}

export function crearItemVenta(
  producto: Producto,
  cantidad: number
): ItemVenta {
  const precio = convertirNumero(producto.precio);

  return {
    productoId: producto.id,
    producto: producto.nombre,
    cantidad,
    precio,
    subtotal: precio * cantidad,
  };
}

export function crearVenta(
  cliente: string,
  items: ItemVenta[],
  metodoPago = "Efectivo",
  estado: "Pagada" | "Pendiente" = "Pagada",
  observaciones = ""
): Venta {
  return {
    id: Date.now(),
    codigo: `VTA-${Date.now()}`,
    cliente,
    fecha: new Date().toLocaleDateString(),
    metodoPago,
    estado,
    observaciones,
    items,
    total: calcularTotal(items),
  };
}