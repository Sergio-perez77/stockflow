export function existeProducto(
  productos: Record<string, unknown>[],
  nuevoProducto: Record<string, unknown>
): boolean {
  const skuNuevo = String(
    nuevoProducto.sku ?? ""
  ).trim();

  if (!skuNuevo) {
    return false;
  }

  return productos.some(
    (producto) =>
      String(producto.sku ?? "").trim() === skuNuevo
  );
}