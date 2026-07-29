import { Producto } from "@/types/producto";

export function obtenerProductoPorId(
  productos: Producto[],
  id: number
) {
  return productos.find(
    (producto) => producto.id === id
  );
}

export function obtenerProductoPorNombre(
  productos: Producto[],
  nombre: string
) {
  return productos.find(
    (producto) => producto.nombre === nombre
  );
}

export function actualizarStock(
  productos: Producto[],
  id: number,
  nuevoStock: number
) {
  return productos.map((producto) =>
    producto.id === id
      ? {
          ...producto,
          stock: nuevoStock,
        }
      : producto
  );
}