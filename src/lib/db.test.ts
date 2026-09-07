import test from "node:test";
import assert from "node:assert/strict";

import { apiCollectionNameForKey, replaceCollectionData } from "./db.ts";

test("mapea productos a la colección products de la API", () => {
  assert.equal(apiCollectionNameForKey("productos"), "products");
  assert.equal(apiCollectionNameForKey("clientes"), "clientes");
  assert.equal(apiCollectionNameForKey("ventas"), "ventas");
});

test("replaceCollectionData reemplaza el contenido de la colección en lugar de acumularlo", () => {
  const db = {
    products: [{ id: 1, nombre: "Viejo" }],
    clientes: [],
    proveedores: [],
    ventas: [],
    users: [],
  };

  const result = replaceCollectionData(db, "products", [
    { id: 2, nombre: "Nuevo" },
    { id: 3, nombre: "Otro" },
  ]);

  assert.deepEqual(result.products, [
    { id: 2, nombre: "Nuevo" },
    { id: 3, nombre: "Otro" },
  ]);
  assert.deepEqual(result.clientes, []);
});
