export function cargarDatos<T>(clave: string): T[] {
  if (typeof window === "undefined") return [];

  const datos = localStorage.getItem(clave);

  return datos ? JSON.parse(datos) : [];
}

export function guardarDatos<T>(clave: string, datos: T[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(clave, JSON.stringify(datos));
}