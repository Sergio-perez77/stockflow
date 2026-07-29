import type { Producto } from "@/types/producto";
import type { Venta, ItemVenta } from "@/types/venta";

export function calcularSubtotal(
  producto: Producto,
  cantidad: number
) {
  return (
    Number(producto.precio.replace("$", "")) *
    cantidad
  );
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
  return {
    productoId: producto.id,
    producto: producto.nombre,
    cantidad,
    precio: Number(
      producto.precio.replace("$", "")
    ),
    subtotal: calcularSubtotal(
      producto,
      cantidad
    ),
  };
}

export function crearVenta(
  cliente: string,
  items: ItemVenta[]
): Venta {
  return {
    id: Date.now(),

    codigo: `VTA-${Date.now()}`,

    cliente,

    fecha: new Date().toLocaleDateString(),

    items,

    total: calcularTotal(items),
  };
}