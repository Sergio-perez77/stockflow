import test from "node:test";
import assert from "node:assert/strict";

import {
  construirClavesRegistro,
  generarClavesDuplicadas,
} from "./importacion.ts";

test("generarClavesDuplicadas normaliza y elimina vacíos", () => {
  assert.deepEqual(
    generarClavesDuplicadas([" 123 ", "", "José", "123"]),
    ["123", "jose"]
  );
});

test("construirClavesRegistro detecta duplicados por nombre, dni y email para clientes", () => {
  const registro = {
    nombre: "José Perez",
    dni: "12345678",
    email: "jose@example.com",
  };

  assert.deepEqual(construirClavesRegistro("clientes", registro), [
    "jose perez",
    "12345678",
    "jose@example.com",
  ]);
});

test("construirClavesRegistro usa sku y codigo para productos", () => {
  const registro = {
    sku: "SKU-001",
    codigo: "PROD-001",
  };

  assert.deepEqual(construirClavesRegistro("productos", registro), [
    "sku-001",
    "prod-001",
  ]);
});

test("construirClavesRegistro considera telefono y contacto para proveedores", () => {
  const registro = {
    empresa: "Distribuidora Norte",
    contacto: "Ana Pérez",
    email: "ana@distribuidora.com",
    telefono: "+54 11 5555-0000",
  };

  assert.deepEqual(construirClavesRegistro("proveedores", registro), [
    "distribuidora norte",
    "ana perez",
    "ana@distribuidora.com",
    "+54 11 5555-0000",
  ]);
});

test("construirClavesRegistro usa fecha como clave adicional para ventas", () => {
  const registro = {
    codigo: "VTA-001",
    cliente: "Carlos Gómez",
    fecha: "2026-09-05",
  };

  assert.deepEqual(construirClavesRegistro("ventas", registro), [
    "vta-001",
    "carlos gomez",
    "2026-09-05",
  ]);
});
