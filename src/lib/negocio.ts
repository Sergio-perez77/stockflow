import type { Negocio } from "@/types/negocio";

export const defaultNegocio: Negocio = {
  nombre: "",
  logo: "",
  propietario: "",
  email: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  pais: "Argentina",
  codigoPostal: "",
  moneda: "ARS",
  simboloMoneda: "$",
};

export function getMonedaSymbol(moneda: string): string {
  const simbolos: Record<string, string> = {
    ARS: "$",
    USD: "US$",
    EUR: "€",
    UYU: "$U",
    CLP: "$",
    PYG: "₲",
    BRL: "R$",
    MXN: "$",
    COP: "$",
    PEN: "S/",
  };

  return simbolos[moneda] ?? "$";
}

export function normalizarNegocio(negocio?: Partial<Negocio>): Negocio {
  const base = { ...defaultNegocio, ...negocio };

  return {
    ...base,
    pais: base.pais || "Argentina",
    moneda: base.moneda || "ARS",
    simboloMoneda: base.simboloMoneda || getMonedaSymbol(base.moneda || "ARS"),
  };
}
