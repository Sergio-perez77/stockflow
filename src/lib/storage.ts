import type { Cliente } from "@/types/cliente";

export function getTenantStorageScope(): string {
  if (typeof window === "undefined") {
    return "anon";
  }

  const rawCookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("stockflow_session="));

  const sessionValue = rawCookie ? rawCookie.split("=").slice(1).join("=") : "";
  const safeSession = decodeURIComponent(sessionValue || "").replace(/[^a-zA-Z0-9:_-]/g, "_");

  return safeSession ? `tenant_${safeSession.slice(0, 32)}` : "tenant_anonymous";
}

export function tenantScopedStorageKey(clave: string): string {
  return `${getTenantStorageScope()}::${clave}`;
}

const API_COLLECTIONS: Record<string, string> = {
  productos: "products",
  clientes: "clientes",
  proveedores: "proveedores",
  ventas: "ventas",
  compras: "compras",
};

export function obtenerRutaApiDatos(clave: string): string | null {
  const coleccion = API_COLLECTIONS[clave];

  return coleccion ? `/api/${coleccion}` : null;
}

export function cargarDatos<T>(clave: string): T[] {
  if (typeof window === "undefined") return [];

  const storageKey = tenantScopedStorageKey(clave);
  const datos = localStorage.getItem(storageKey);

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
        storageKey,
        JSON.stringify(clientesNormalizados)
      );
    }

    return clientesNormalizados as T[];
  }

  return datosParseados;
}

export function guardarDatos<T>(clave: string, datos: T[]) {
  if (typeof window === "undefined") return;

  const storageKey = tenantScopedStorageKey(clave);
  localStorage.setItem(storageKey, JSON.stringify(datos));

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

  const datos = localStorage.getItem(tenantScopedStorageKey(clave));

  return datos ? JSON.parse(datos) : null;
}

export function guardarImportacion<T>(
  clave: string,
  datos: T
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    tenantScopedStorageKey(clave),
    JSON.stringify(datos)
  );
}

export function eliminarImportacion(clave: string) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(tenantScopedStorageKey(clave));
}
