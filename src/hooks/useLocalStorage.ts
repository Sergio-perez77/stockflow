"use client";

import { useEffect, useState } from "react";
import { cargarDatos, obtenerRutaApiDatos } from "@/lib/storage";

export function useLocalStorage<T>(clave: string) {
  const [datos, setDatos] = useState<T[]>(() =>
    typeof window === "undefined" ? [] : cargarDatos<T>(clave)
  );
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(
    null
  );

  useEffect(() => {
    const apiPath = obtenerRutaApiDatos(clave);
    setClaveSincronizada(null);

    if (!apiPath || typeof window === "undefined") {
      setClaveSincronizada(clave);
      return;
    }

    let isActive = true;
    const datosLocales = cargarDatos<T>(clave);

    async function cargarDesdeApi() {
      try {
        const url = apiPath ?? "";
        if (!url) {
          throw new Error("Ruta de API inválida");
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("No se pudo cargar la colección");
        }

        const json = (await response.json()) as { data?: T[] };
        const datosRemotos = Array.isArray(json.data) ? json.data : [];

        if (!isActive) return;

        // Durante la transición desde localStorage, no se descartan datos
        // locales si la colección remota todavía está vacía.
        if (datosRemotos.length === 0 && datosLocales.length > 0) {
          const fallbackUrl = apiPath ?? "";

          if (fallbackUrl) {
            await fetch(fallbackUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(datosLocales),
            });
          }
          return;
        }

        localStorage.setItem(clave, JSON.stringify(datosRemotos));
        setDatos(datosRemotos);
      } catch {
        // Fallback local si la API no está disponible.
      } finally {
        if (isActive) {
          setClaveSincronizada(clave);
        }
      }
    }

    void cargarDesdeApi();

    return () => {
      isActive = false;
    };
  }, [clave]);

  useEffect(() => {
    const apiPath = obtenerRutaApiDatos(clave);

    if (
      typeof window === "undefined" ||
      claveSincronizada !== clave
    ) {
      return;
    }

    localStorage.setItem(clave, JSON.stringify(datos));

    if (!apiPath) return;

    void fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }).catch(() => undefined);
  }, [datos, clave, claveSincronizada]);

  return {
    datos,
    setDatos,
  };
}
