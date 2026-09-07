export function obtenerNumero(
  valor: unknown
): number | null {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.replace(/[$\s]/g, "").trim();

  if (!texto) {
    return null;
  }

  const ultimaComa = texto.lastIndexOf(",");
  const ultimoPunto = texto.lastIndexOf(".");

  let normalizado = texto;

  if (ultimaComa !== -1 && ultimoPunto !== -1) {
    normalizado =
      ultimaComa > ultimoPunto
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto.replace(/,/g, "");
  } else if (ultimaComa !== -1) {
    normalizado = texto.replace(",", ".");
  }

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

export function convertirNumero(valor: unknown): number {
  return obtenerNumero(valor) ?? 0;
}