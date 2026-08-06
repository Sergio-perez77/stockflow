export type Compra = {
  id: number;

  codigo: string;

  producto: string;

  proveedor: string;

  cantidad: number;

  costo: number;

  fecha: string;

  metodoPago: string;

  estado: "Pagada" | "Pendiente" | "Anulada";

  observaciones: string;
};