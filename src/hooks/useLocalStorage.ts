"use client";

import { useEffect, useState } from "react";
import { cargarDatos, guardarDatos } from "@/lib/storage";

export function useLocalStorage<T>(clave: string) {
  const [datos, setDatos] = useState<T[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setDatos(cargarDatos<T>(clave));
    setCargado(true);
  }, [clave]);

  useEffect(() => {
    if (!cargado) return;

    guardarDatos(clave, datos);
  }, [datos, clave, cargado]);

  return {
    datos,
    setDatos,
    cargado,
  };
}