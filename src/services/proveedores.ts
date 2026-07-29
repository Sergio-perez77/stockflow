import type { Proveedor } from "@/types/proveedor";

export function crearProveedor(
  proveedor: Omit<Proveedor, "id">
): Proveedor {
  return {
    id: Date.now(),
    ...proveedor,
  };
}