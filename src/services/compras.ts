import type { Producto } from "@/types/producto";
import type { Compra } from "@/types/compra";

export function aumentarStock(
  productos: Producto[],
  nombreProducto: string,
  cantidad: number
) {
  return productos.map((producto) =>
    producto.nombre === nombreProducto
      ? {
          ...producto,
          stock: producto.stock + cantidad,
        }
      : producto
  );
}

export function crearCompra(
  compra: Omit<Compra, "id">
): Compra {
  return {
    id: Date.now(),
    ...compra,
  };
}