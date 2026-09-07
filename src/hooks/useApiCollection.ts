"use client";

import { useCallback, useEffect, useState } from "react";

export type ApiCollection = "products" | "clientes" | "proveedores" | "ventas";

export function useApiCollection<T>(collection: ApiCollection, initial: T[] = []) {
  const [datos, setDatos] = useState<T[]>(initial);
  const [loading, setLoading] = useState(true);

  const apiPath = `/api/${collection}`;

  const persist = useCallback(
    async (next: T[]) => {
      setDatos(next);

      await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    },
    [apiPath]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(apiPath);

        if (!response.ok) {
          throw new Error("No se pudo cargar la colección");
        }

        const json = (await response.json()) as { data?: T[] };

        if (active) {
          setDatos(json.data ?? []);
        }
      } catch {
        if (active) {
          setDatos(initial);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [apiPath, initial]);

  const setCollectionData = useCallback(
    (value: T[] | ((current: T[]) => T[])) => {
      setDatos((current) => {
        const next = typeof value === "function" ? value(current) : value;

        void persist(next);

        return next;
      });
    },
    [persist]
  );

  return {
    datos,
    loading,
    setDatos: setCollectionData,
  };
}
