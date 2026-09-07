export function generarClavesDuplicadas(
  valores: Array<string | undefined>
): string[] {
  const claves = new Set<string>();

  valores.forEach((valor) => {
    const clave = String(valor ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (clave) {
      claves.add(clave);
    }
  });

  return [...claves];
}

export function normalizarValorImportado(valor: unknown): string {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function construirClavesRegistro(
  tipo: string,
  registro: Record<string, unknown>
): string[] {
  const normalizar = (valor: unknown) => normalizarValorImportado(valor);

  if (tipo === "productos") {
    return generarClavesDuplicadas([
      normalizar(registro.sku),
      normalizar(registro.codigo),
    ]);
  }

  if (tipo === "clientes") {
    return generarClavesDuplicadas([
      normalizar(registro.nombre),
      normalizar(registro.dni),
      normalizar(registro.email),
    ]);
  }

  if (tipo === "proveedores") {
    return generarClavesDuplicadas([
      normalizar(registro.empresa),
      normalizar(registro.contacto),
      normalizar(registro.email),
      normalizar(registro.telefono),
    ]);
  }

  if (tipo === "ventas") {
    return generarClavesDuplicadas([
      normalizar(registro.codigo),
      normalizar(registro.cliente),
      normalizar(registro.fecha),
    ]);
  }

  return generarClavesDuplicadas(
    Object.values(registro).map((valor) => normalizar(valor))
  );
}
