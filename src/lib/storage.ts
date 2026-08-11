export function cargarDatos<T>(clave: string): T[] {
  if (typeof window === "undefined") return [];

  const datos = localStorage.getItem(clave);

  return datos ? JSON.parse(datos) : [];
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