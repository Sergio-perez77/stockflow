"use client";

import { useEffect, useState } from "react";
import { cargarDatos, obtenerRutaApiDatos, tenantScopedStorageKey } from "@/lib/storage";

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

    const apiUrl = apiPath;
    let isActive = true;

    async function cargarDesdeApi() {
      try {
        const response = await fetch(apiUrl, { credentials: "include" });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem(tenantScopedStorageKey(clave));
            setDatos([]);
            return;
          }
          throw new Error("No se pudo cargar la colección");
        }

        const json = (await response.json()) as { data?: T[] };
        const datosRemotos = Array.isArray(json.data) ? json.data : [];

        if (!isActive) return;

        localStorage.setItem(tenantScopedStorageKey(clave), JSON.stringify(datosRemotos));
        setDatos(datosRemotos);
      } catch {
        const fallback = cargarDatos<T>(clave);
        if (isActive) {
          setDatos(fallback);
        }
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

    localStorage.setItem(tenantScopedStorageKey(clave), JSON.stringify(datos));

    if (!apiPath) return;

    const apiUrl = apiPath;

    void fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(datos),
    }).catch(() => undefined);
  }, [datos, clave, claveSincronizada]);

  return {
    datos,
    setDatos,
  };
}
