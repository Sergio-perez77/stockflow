export function generarCodigo(
  prefijo: string,
  codigosExistentes: string[]
) {
  let mayorNumero = 0;

  codigosExistentes.forEach((codigo) => {
    const numero = Number(
      codigo.replace(`${prefijo}-`, "")
    );

    if (numero > mayorNumero) {
      mayorNumero = numero;
    }
  });

  return `${prefijo}-${String(mayorNumero + 1).padStart(6, "0")}`;
}