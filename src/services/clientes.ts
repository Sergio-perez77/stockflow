import type { Cliente } from "@/types/cliente";

export function crearCliente(
  cliente: Omit<Cliente, "id">
): Cliente {
  return {
    id: Date.now(),
    ...cliente,
  };
}