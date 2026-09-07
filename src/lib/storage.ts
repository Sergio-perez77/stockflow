import type { Cliente } from "@/types/cliente";

const API_COLLECTIONS: Record<string, string> = {
  productos: "products",
  clientes: "clientes",
  proveedores: "proveedores",
  ventas: "ventas",
};

export function obtenerRutaApiDatos(clave: string): string | null {
  const coleccion = API_COLLECTIONS[clave];

  return coleccion ? `/api/${coleccion}` : null;
}

export function cargarDatos<T>(clave: string): T[] {
  if (typeof window === "undefined") return [];

  const datos = localStorage.getItem(clave);

  if (!datos) return [];

  const datosParseados = JSON.parse(datos);

  if (clave === "clientes") {
    const clientes = datosParseados as Cliente[];

    const idsUsados = new Set<number>();

    const clientesNormalizados = clientes.map((cliente) => {
      let id = cliente.id;

      if (idsUsados.has(id)) {
        id = Date.now();

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

  const apiPath = obtenerRutaApiDatos(clave);

  if (!apiPath) return;

  void fetch(apiPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).catch(() => undefined);
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
