import type { Cliente } from "@/types/cliente";

export function cargarDatos<T>(clave: string): T[] {
  if (typeof window === "undefined") return [];

  const datos = localStorage.getItem(clave);

  if (!datos) return [];

  const datosParseados = JSON.parse(datos);

  // ==========================================
  // NORMALIZACIÓN DE CLIENTES
  // ==========================================

  if (clave === "clientes") {
    const clientes = datosParseados as Cliente[];

    const idsUsados = new Set<number>();

    const clientesNormalizados = clientes.map((cliente) => {
      let id = cliente.id;

      // Si el ID ya existe, generamos uno nuevo
      if (idsUsados.has(id)) {
        id = Date.now();

        // Nos aseguramos de que tampoco coincida
        while (idsUsados.has(id)) {
          id++;
        }
      }

      idsUsados.add(id);

      return {
        ...cliente,
        id,
      };
    });

    // Si hubo cambios, guardamos inmediatamente la versión corregida
    if (
      JSON.stringify(clientesNormalizados) !==
      JSON.stringify(clientes)
    ) {
      localStorage.setItem(
        clave,
        JSON.stringify(clientesNormalizados)
      );
    }

    return clientesNormalizados as T[];
  }

  return datosParseados;
}

export function guardarDatos<T>(clave: string, datos: T[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(clave, JSON.stringify(datos));
}


/* ================================
   IMPORTACIÓN TEMPORAL
================================ */

export function cargarImportacion<T>(clave: string): T | null {
  if (typeof window === "undefined") return null;

  const datos = localStorage.getItem(clave);

  return datos ? JSON.parse(datos) : null;
}

export function guardarImportacion<T>(
  clave: string,
  datos: T
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    clave,
    JSON.stringify(datos)
  );
}

export function eliminarImportacion(clave: string) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(clave);
}