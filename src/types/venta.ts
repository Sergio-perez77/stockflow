export type ItemVenta = {
  productoId: number;
  producto: string;
  cantidad: number;
  precio: number;
  subtotal: number;
};

export type Venta = {
  id: number;

  codigo: string;

  cliente: string;

  fecha: string;

  metodoPago: string;

  estado: "Pagada" | "Pendiente" | "Anulada";

  items: ItemVenta[];

  total: number;
};