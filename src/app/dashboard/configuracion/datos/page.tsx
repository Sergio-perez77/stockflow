"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import {
  cargarDatos,
  guardarDatos,
  cargarImportacion,
  guardarImportacion,
  eliminarImportacion,
} from "@/lib/storage";

type FilaImportada = Record<string, unknown>;

type ImportacionPendiente = {
  nombreArchivo: string;
  columnas: string[];
  filas: FilaImportada[];
};

type TipoDatos =
  | "productos"
  | "clientes"
  | "proveedores"
  | "ventas";



type MapeoColumnas = Record<string, string>;

export default function DatosPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [filas, setFilas] = useState<FilaImportada[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [importacionPendiente, setImportacionPendiente] =
  useState<ImportacionPendiente | null>(null);

  const [mostrarMapeo, setMostrarMapeo] = useState(false);
  const [tipoDatos, setTipoDatos] = useState<
    "productos" | "clientes" | "proveedores" | "ventas" | null
  >(null);

  const [mapeoColumnas, setMapeoColumnas] =
  useState<MapeoColumnas>({});

  const [erroresMapeo, setErroresMapeo] = useState<string[]>([]);

  const [importacionValidada, setImportacionValidada] = useState(false);

  useEffect(() => {
  const pendiente =
    cargarImportacion<ImportacionPendiente>(
      "importacion_pendiente"
    );

  if (!pendiente) return;

  setImportacionPendiente(pendiente);
  setFilas(pendiente.filas);
  setColumnas(pendiente.columnas);
}, []);


const camposStockFlow: Record<
  "productos" | "clientes" | "proveedores" | "ventas",
  string[]
> = {
  productos: [
    "codigo",
    "sku",
    "nombre",
    "categoria",
    "stock",
    "stockMinimo",
    "costo",
    "precio",
  ],

  clientes: [
    "nombre",
    "documento",
    "telefono",
    "email",
    "direccion",
  ],

  proveedores: [
    "nombre",
    "cuit",
    "telefono",
    "email",
    "direccion",
  ],

  ventas: [
    "codigo",
    "cliente",
    "fecha",
    "metodoPago",
    "estado",
    "total",
  ],
};


  function detectarTipoDatos(
  columnas: string[]
): "productos" | "clientes" | "proveedores" | "ventas" | null {

  const columnasNormalizadas = columnas.map((columna) =>
    columna
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  );

  const tiene = (...nombres: string[]) =>
    nombres.some((nombre) =>
      columnasNormalizadas.some((columna) =>
        columna.includes(nombre)
      )
    );

  if (
    tiene("sku", "producto", "articulo") &&
    tiene("stock", "existencia", "cantidad")
  ) {
    return "productos";
  }

  if (
    tiene("cliente", "nombre") &&
    tiene("telefono", "email", "correo", "documento")
  ) {
    return "clientes";
  }

  if (
    tiene("proveedor", "empresa") &&
    tiene("telefono", "email", "correo", "cuit")
  ) {
    return "proveedores";
  }

  if (
    tiene("venta", "fecha") &&
    tiene("total", "importe", "monto")
  ) {
    return "ventas";
  }

  return null;
}

  function continuarImportacion() {
  if (!importacionPendiente) return;

  const tipoDetectado = detectarTipoDatos(
    importacionPendiente.columnas
  );

  setTipoDatos(tipoDetectado);

  if (tipoDetectado) {
    const campos = camposStockFlow[tipoDetectado];

    const nuevoMapeo: MapeoColumnas = {};

    campos.forEach((campo) => {
      const columnaEncontrada =
        importacionPendiente.columnas.find(
          (columna) => {

            const origen = columna
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");

            const destino = campo
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");

            return (
              origen.includes(destino) ||
              destino.includes(origen)
            );
          }
        );

      nuevoMapeo[campo] = columnaEncontrada || "";
    });

    setMapeoColumnas(nuevoMapeo);
  }

  setMostrarMapeo(true);
}

 function validarMapeo(): boolean {
  if (!tipoDatos) {
    setErroresMapeo([
      "No se pudo determinar el tipo de información.",
    ]);

    setImportacionValidada(false);

    return false;
  }

  const errores: string[] = [];

  const camposObligatorios: Record<TipoDatos, string[]> = {
    productos: [
      "nombre",
    ],

    clientes: [
      "nombre",
    ],

    proveedores: [
      "nombre",
    ],

    ventas: [
      "fecha",
      "total",
    ],
  };

  camposObligatorios[tipoDatos].forEach((campo) => {
    if (!mapeoColumnas[campo]) {
      errores.push(
        `El campo "${campo}" es obligatorio.`
      );
    }
  });

  const columnasUtilizadas = Object.entries(
    mapeoColumnas
  )
    .filter(([, columna]) => columna)
    .map(([, columna]) => columna);

  const columnasDuplicadas =
    columnasUtilizadas.filter(
      (columna, indice) =>
        columnasUtilizadas.indexOf(columna) !== indice
    );

  const columnasDuplicadasUnicas = [
    ...new Set(columnasDuplicadas),
  ];

  columnasDuplicadasUnicas.forEach((columna) => {
    errores.push(
      `La columna "${columna}" está asignada a más de un campo.`
    );
  });

  setErroresMapeo(errores);

  if (errores.length > 0) {
    setImportacionValidada(false);
    return false;
  }

  setImportacionValidada(true);

  return true;
}

  function importarDatos() {
  if (!tipoDatos || !importacionPendiente) {
    return;
  }

  if (!validarMapeo()) {
    return;
  }

  const registrosImportados = importacionPendiente.filas.map(
    (fila) => {
      const registro: Record<string, unknown> = {};

      camposStockFlow[tipoDatos].forEach((campo) => {
        const columnaOrigen = mapeoColumnas[campo];

        if (!columnaOrigen) {
          return;
        }

        registro[campo] = fila[columnaOrigen];
      });

      return {
        id: Date.now() + Math.random(),
        ...registro,
      };
    }
  );

  const claveStorage = tipoDatos;

  const datosExistentes =
    cargarDatos<Record<string, unknown>>(claveStorage);

  guardarDatos(
    claveStorage,
    [
      ...datosExistentes,
      ...registrosImportados,
    ]
  );

  eliminarImportacion("importacion_pendiente");

  setImportacionValidada(false);
  setMostrarMapeo(false);
  setImportacionPendiente(null);
  setFilas([]);
  setColumnas([]);
  setMapeoColumnas({});
  setErroresMapeo([]);
  setTipoDatos(null);
  setArchivo(null);

  alert(
    `Importación completada. Se importaron ${registrosImportados.length} registros.`
  );
}

  async function seleccionarArchivo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setArchivo(file);
    setFilas([]);
    setColumnas([]);

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      const primeraHoja = workbook.SheetNames[0];

      if (!primeraHoja) {
        setError("El archivo no contiene ninguna hoja.");
        return;
      }

      const hoja = workbook.Sheets[primeraHoja];

      const datos = XLSX.utils.sheet_to_json<FilaImportada>(
        hoja,
        {
          defval: "",
        }
      );

      if (datos.length === 0) {
        setError("El archivo no contiene registros.");
        return;
      }

      const columnasDetectadas = Object.keys(datos[0]);

      setColumnas(columnasDetectadas);
      setFilas(datos);

    const nuevaImportacion: ImportacionPendiente = {
    nombreArchivo: file.name,
    columnas: columnasDetectadas,
    filas: datos,
    };

    guardarImportacion(
    "importacion_pendiente",
    nuevaImportacion
    );

    setImportacionPendiente(nuevaImportacion);

    } catch (error) {
      console.error(error);

      setError(
        "No se pudo leer el archivo. Verificá que sea un Excel o CSV válido."
      );
    }
  }
  

  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-2">
        Datos
      </h1>

      <p className="text-gray-400 mb-8">
        Importá y exportá la información de tu negocio.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* IMPORTAR */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-2xl font-bold text-white mb-2">
            Importar datos
          </h2>

          <p className="text-gray-400 mb-6">
            Importá información desde Excel, CSV u otros archivos.
          </p>

          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 transition rounded-xl p-8 text-center">

            <div className="text-4xl mb-4">
              ↑
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              Subí tus datos
            </h3>

            <p className="text-gray-400 text-sm mb-6">
              StockFlow analizará las columnas antes de importar la información.
            </p>

            <label className="inline-block cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition">

              Seleccionar archivo

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={seleccionarArchivo}
                className="hidden"
              />

            </label>

            {(archivo || importacionPendiente) && (
            <div className="mt-5 bg-slate-800 rounded-lg p-4 text-left">

              <p className="text-sm text-gray-400">
                Importación pendiente
              </p>

              <p className="text-white font-semibold mt-1">
                {archivo?.name || importacionPendiente?.nombreArchivo}
              </p>

              <p className="text-gray-400 text-sm mt-2">
                {filas.length} registros detectados.
              </p>

             <button
              type="button"
              onClick={continuarImportacion}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Continuar importación
            </button>

            </div>
      )}

            {error && (
              <div className="mt-5 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

          </div>

        </div>


        {/* EXPORTAR */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-2xl font-bold text-white mb-2">
            Exportar datos
          </h2>

          <p className="text-gray-400 mb-6">
            Descargá tus datos almacenados en StockFlow.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <button
              type="button"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-5 text-left transition"
            >
              <h3 className="font-semibold text-white">
                Productos
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Exportar inventario.
              </p>
            </button>

            <button
              type="button"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-5 text-left transition"
            >
              <h3 className="font-semibold text-white">
                Clientes
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Exportar clientes.
              </p>
            </button>

            <button
              type="button"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-5 text-left transition"
            >
              <h3 className="font-semibold text-white">
                Proveedores
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Exportar proveedores.
              </p>
            </button>

            <button
              type="button"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-5 text-left transition"
            >
              <h3 className="font-semibold text-white">
                Ventas
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Exportar historial de ventas.
              </p>
            </button>

          </div>

        </div>

      </div>


      {/* VISTA PREVIA */}

      {filas.length > 0 && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-2xl font-bold text-white">
                Vista previa
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                {filas.length} registros detectados.
              </p>
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-slate-700">

                <tr>
                  {columnas.map((columna) => (
                    <th
                      key={columna}
                      className="text-left py-3 px-3 text-gray-400 whitespace-nowrap"
                    >
                      {columna}
                    </th>
                  ))}
                </tr>

              </thead>

              <tbody>

                {filas.slice(0, 10).map((fila, indice) => (
                  <tr
                    key={indice}
                    className="border-b border-slate-800"
                  >
                    {columnas.map((columna) => (
                      <td
                        key={columna}
                        className="py-3 px-3 text-white whitespace-nowrap"
                      >
                        {String(fila[columna] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {filas.length > 10 && (
            <p className="text-gray-500 text-sm mt-4">
              Mostrando los primeros 10 registros de {filas.length}.
            </p>
          )}

        </div>
      )}

      {mostrarMapeo && (
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-white">
            Analizar importación
          </h2>

          <p className="text-gray-400 text-sm mt-2">
            StockFlow analizó las columnas de tu archivo y preparó
            la información para la importación.
          </p>

        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">

          <p className="text-gray-400 text-sm">
            Tipo de información detectada
          </p>

          <p className="text-cyan-400 text-xl font-bold mt-1">
            {tipoDatos
              ? tipoDatos.charAt(0).toUpperCase() +
                tipoDatos.slice(1)
              : "No identificado"}
          </p>

          <p className="text-gray-400 text-sm mt-2">
            {importacionPendiente?.filas.length} registros
          </p>

        </div>

        <div>

          <h3 className="text-lg font-semibold text-white mb-4">
            Columnas detectadas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

            {importacionPendiente?.columnas.map((columna) => (

              <div
                key={columna}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
              >

                <p className="text-white font-medium">
                  {columna}
                </p>

              </div>

            ))}

          </div>

        </div>

        {tipoDatos && (
      <div className="mt-8">

        <h3 className="text-lg font-semibold text-white mb-2">
          Mapeo de columnas
        </h3>

        <p className="text-gray-400 text-sm mb-6">
          Indicá qué columna de tu archivo corresponde a cada
          campo de StockFlow.
        </p>

        <div className="space-y-4">

          {camposStockFlow[tipoDatos].map((campo) => (

            <div
              key={campo}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-800 border border-slate-700 rounded-lg p-4"
            >

              <div>

                <p className="text-gray-400 text-xs uppercase">
                  Campo StockFlow
                </p>

                <p className="text-white font-semibold mt-1">
                  {campo}
                </p>

              </div>

              <div>

                <p className="text-gray-400 text-xs uppercase mb-1">
                  Columna del archivo
                </p>

                <select
                  value={mapeoColumnas[campo] || ""}
                  onChange={(e) => {
                    setMapeoColumnas((actual) => ({
                      ...actual,
                      [campo]: e.target.value,
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
                >

                  <option value="">
                    No importar este campo
                  </option>

                  {importacionPendiente?.columnas.map(
                    (columna) => (
                      <option
                        key={columna}
                        value={columna}
                      >
                        {columna}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

          ))}

        </div>

        <div className="mt-8 flex justify-end">

          {erroresMapeo.length > 0 && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">

            <h4 className="text-red-400 font-semibold mb-2">
              Revisá el mapeo
            </h4>

            <ul className="space-y-1">

              {erroresMapeo.map((error, indice) => (
                <li
                  key={indice}
                  className="text-red-400 text-sm"
                >
                  • {error}
                </li>
              ))}

            </ul>

          </div>
        )}

          <button
            type="button"
            onClick={validarMapeo}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Validar importación
          </button>

        </div>

        {importacionValidada && (
          <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-5">

            <h4 className="text-green-400 font-semibold">
              Mapeo validado correctamente
            </h4>

            <p className="text-gray-400 text-sm mt-2">
              StockFlow puede importar los registros utilizando
              la configuración seleccionada.
            </p>

            <div className="mt-5 flex justify-end">

              <button
                type="button"
                onClick={importarDatos}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Importar {importacionPendiente?.filas.length || 0} registros
              </button>

            </div>

          </div>
        )}

      </div>
    )}

        {!tipoDatos && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">

            <p className="text-yellow-400 font-semibold">
              No pudimos determinar automáticamente el tipo de información.
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Podrás seleccionar manualmente qué tipo de datos contiene
              este archivo en el siguiente paso.
            </p>

          </div>
        )}

      </div>
    )}

    </>
  );
}