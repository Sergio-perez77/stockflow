import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultNegocio,
  getMonedaSymbol,
  normalizarNegocio,
} from "./negocio.ts";

test("getMonedaSymbol devuelve el símbolo correcto para USD", () => {
  assert.equal(getMonedaSymbol("USD"), "US$");
  assert.equal(getMonedaSymbol("ARS"), "$");
});

test("normalizarNegocio rellena valores por defecto y usa moneda por defecto", () => {
  const negocio = normalizarNegocio({
    nombre: "Mi Negocio",
    propietario: "Ana",
    email: "ana@test.com",
    telefono: "112233",
    direccion: "Av. Siempre Viva 123",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    pais: "",
    codigoPostal: "5000",
    moneda: "",
    simboloMoneda: "",
    logo: "",
  });

  assert.equal(negocio.pais, "Argentina");
  assert.equal(negocio.moneda, "ARS");
  assert.equal(negocio.simboloMoneda, "$");
  assert.equal(negocio.nombre, "Mi Negocio");
});

test("defaultNegocio tiene valores iniciales del negocio", () => {
  assert.equal(defaultNegocio.pais, "Argentina");
  assert.equal(defaultNegocio.moneda, "ARS");
  assert.equal(defaultNegocio.simboloMoneda, "$");
});
