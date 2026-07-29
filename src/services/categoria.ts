import type { Categoria } from "@/types/categoria";

export function crearCategoria(
  categoria: Omit<Categoria, "id">
): Categoria {
  return {
    id: Date.now(),
    ...categoria,
  };
}