"use client";

import { existeProducto } from "@/lib/detectarDuplicados";

import { generarCodigo } from "@/lib/generadorCodigos";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import {
  cargarDatos,
  guardarDatos,
  cargarImportacion,
  guardarImportacion,
  eliminarImportacion,
} from "@/lib/storage";

import type { Venta } from "@/types/venta";

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

  const [tipoDatosManual, setTipoDatosManual] =
  useState<TipoDatos | null>(null);

  const [mapeoColumnas, setMapeoColumnas] =
  useState<MapeoColumnas>({});

  const [erroresMapeo, setErroresMapeo] = useState<string[]>([]);

  const [importacionValidada, setImportacionValidada] = useState(false);

  function generarIdsImportacion(
  tipo: string,
  cantidad: number
): number[] {
  const datosExistentes = cargarDatos<{ id: number }>(tipo);

  const idsUsados = new Set(
    datosExistentes.map((dato) => dato.id)
  );

  const ids: number[] = [];

  let siguienteId = Date.now();

  for (let i = 0; i < cantidad; i++) {
    while (idsUsados.has(siguienteId)) {
      siguienteId++;
    }

    ids.push(siguienteId);
    idsUsados.add(siguienteId);
    siguienteId++;
  }

  return ids;
}


  function convertirNumero(valor: unknown): number {
  if (typeof valor === "number") {
    return Number.isNaN(valor) ? 0 : valor;
  }

  if (typeof valor === "string") {
    const numero = Number(
      valor
        .replace("$", "")
        .replace(",", ".")
        .trim()
    );

    return Number.isNaN(numero) ? 0 : numero;
  }

  return 0;
}

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
    "codigo",
    "nombre",
    "dni",
    "telefono",
    "email",
    
  ],

  proveedores: [
    "empresa",
    "contacto",
    "telefono",
    "email",
    
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

  // VENTAS
  if (
    tiene("fecha") &&
    tiene("total", "importe", "monto", "venta")
  ) {
    return "ventas";
  }

  // PRODUCTOS
  if (
    tiene(
      "producto",
      "articulo",
      "sku",
      "codigo",
      "descripcion"
    ) &&
    tiene(
      "stock",
      "existencia",
      "cantidad",
      "inventario"
    )
  ) {
    return "productos";
  }

  // PROVEEDORES
  if (
    tiene(
      "proveedor",
      "razon social",
      "empresa"
    ) &&
    tiene(
      "cuit",
      "telefono",
      "email",
      "correo"
    )
  ) {
    return "proveedores";
  }

  // CLIENTES
  if (
    tiene(
      "cliente",
      "nombre",
      "apellido"
    ) &&
    tiene(
      "dni",
      "documento",
      "telefono",
      "email",
      "correo"
    )
  ) {
    return "clientes";
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
      const equivalencias: Record<string, string[]> = {
      codigo: [
        "codigo",
        "cod",
        "codigo producto",
        "codigo articulo",
        "code",
      ],

      sku: [
        "sku",
        "codigo sku",
        "referencia",
        "ref",
      ],

      nombre: [
        "nombre",
        "producto",
        "articulo",
        "descripcion",
        "descripcion producto",
        "nombre producto",
      ],

      categoria: [
        "categoria",
        "rubro",
        "familia",
        "tipo",
      ],

      stock: [
        "stock",
        "existencia",
        "existencias",
        "cantidad",
        "cantidad disponible",
        "stock actual",
        "inventario",
      ],

      stockMinimo: [
        "stock minimo",
        "stockminimo",
        "minimo",
        "minimo stock",
        "punto de pedido",
      ],

      costo: [
        "costo",
        "coste",
        "precio costo",
        "precio de costo",
        "costo unitario",
      ],

      precio: [
        "precio",
        "precio venta",
        "precio de venta",
        "p venta",
        "p. venta",
        "venta",
      ],

      documento: [
        "dni",
        "documento",
        "documento cliente",
        "identificacion",
      ],

      empresa: [
        "empresa",
        "proveedor",
        "razon social",
        "razon",
        "nombre empresa",
      ],

      contacto: [
        "contacto",
        "persona contacto",
        "contacto proveedor",
      ],

      telefono: [
        "telefono",
        "tel",
        "celular",
        "movil",
        "phone",
      ],

      email: [
        "email",
        "correo",
        "correo electronico",
        "mail",
      ],

      direccion: [
        "direccion",
        "domicilio",
        "calle",
      ],

      cuit: [
        "cuit",
        "cuit proveedor",
        "identificacion fiscal",
      ],

      cliente: [
        "cliente",
        "nombre cliente",
        "cliente nombre",
      ],

      fecha: [
        "fecha",
        "fecha venta",
        "fecha de venta",
      ],

      metodoPago: [
        "metodo pago",
        "forma pago",
        "medio pago",
        "pago",
      ],

      estado: [
        "estado",
        "estado venta",
        "situacion",
      ],

      total: [
        "total",
        "importe",
        "monto",
        "total venta",
        "importe total",
      ],
    };

    const normalizar = (texto: string) =>
      texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    

    const posibles = equivalencias[campo] || [
      normalizar(campo),
    ];

    const columnaEncontrada =
      importacionPendiente.columnas.find(
        (columna) => {
          const columnaNormalizada =
            normalizar(columna);

          return posibles.some(
            (posible) =>
              columnaNormalizada === posible ||
              columnaNormalizada.includes(posible) ||
              posible.includes(columnaNormalizada)
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
    "stock",
    "precio",
  ],

  clientes: [
    "nombre",
  ],

  proveedores: [
    "empresa",
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

  function generarIdImportacion(tipo: string) {
  const datosExistentes = cargarDatos<{ id: number }>(tipo);

  const idsExistentes = new Set(
    datosExistentes.map((dato) => dato.id)
  );

  let id = Date.now();

  while (idsExistentes.has(id)) {
    id++;
  }

  return id;
}

  function importarDatos() {
  if (!tipoDatos || !importacionPendiente) {
    return;
  }

  if (!validarMapeo()) {
    return;
  }

  const idsImportacion = generarIdsImportacion(
  tipoDatos,
  importacionPendiente.filas.length
);

  if (tipoDatos === "ventas") {
    const codigosVentas = cargarDatos<{
      codigo?: string;
    }>("ventas")
      .map((venta) => venta.codigo)
      .filter((codigo): codigo is string => Boolean(codigo));

    const ventasImportadas: Venta[] =
      importacionPendiente.filas.map((fila, indice) => {

        let codigo = String(
          fila[mapeoColumnas.codigo] ?? ""
        ).trim();

        if (!codigo) {
          codigo = generarCodigo(
            "VTA",
            codigosVentas
          );

          codigosVentas.push(codigo);
        }

        const cliente =
          String(
            fila[mapeoColumnas.cliente] ?? ""
          );

        const fecha =
          String(
            fila[mapeoColumnas.fecha] ?? ""
          );

        const metodoPago =
          String(
            fila[mapeoColumnas.metodoPago] ?? ""
          );

        const estadoOrigen =
          String(
            fila[mapeoColumnas.estado] ?? "Pagada"
          );

        const estado: Venta["estado"] =
          estadoOrigen === "Pendiente" ||
          estadoOrigen === "Anulada"
            ? estadoOrigen
            : "Pagada";

        const total =
          Number(
            fila[mapeoColumnas.total] ?? 0
          );

        return {
          id: idsImportacion[indice],

          codigo,

          cliente,

          fecha,

          metodoPago,

          estado,

          observaciones: "",

          items: [],

          total: Number.isNaN(total)
            ? 0
            : total,
        };
      });

    const ventasExistentes =
      cargarDatos<Venta>("ventas");

    guardarDatos(
      "ventas",
      [
        ...ventasExistentes,
        ...ventasImportadas,
      ]
    );

    eliminarImportacion(
      "importacion_pendiente"
    );

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
      `Importación completada. Se importaron ${ventasImportadas.length} ventas.`
    );

    return;
  }

  let codigosProductos: string[] = [];

  if (tipoDatos === "productos") {
    const productosExistentes =
      cargarDatos<{ codigo?: string }>("productos");

    codigosProductos = productosExistentes
      .map((producto) => producto.codigo || "")
      .filter(Boolean);
  }

  
    const codigosClientes = cargarDatos<{
    codigo?: string;
  }>("clientes")
    .map((cliente) => cliente.codigo)
    .filter((codigo): codigo is string => Boolean(codigo));


  const registrosImportados =
    importacionPendiente.filas.map((fila, indice) => {

      const registro: Record<string, unknown> = {};

      camposStockFlow[tipoDatos].forEach(
        (campo) => {

          const columnaOrigen =
          mapeoColumnas[campo];

        if (!columnaOrigen && campo !== "codigo") {
          return;
        }

        const valor = columnaOrigen
          ? fila[columnaOrigen]
          : "";

          if (
            tipoDatos === "productos" &&
            campo === "codigo" &&
            !String(valor).trim()
          ) {
            const nuevoCodigo = generarCodigo(
              "PROD",
              codigosProductos
            );

            codigosProductos.push(nuevoCodigo);

            registro[campo] = nuevoCodigo;

            return;
          }

          if (
            tipoDatos === "clientes" &&
            campo === "codigo" &&
            !String(valor).trim()
          ) {
            const nuevoCodigo = generarCodigo(
              "CLI",
              codigosClientes
            );

            codigosClientes.push(nuevoCodigo);

            registro[campo] = nuevoCodigo;

            return;
          }

          if (
          tipoDatos === "productos" &&
          (
            campo === "stock" ||
            campo === "stockMinimo"
          )
        ) {
          registro[campo] =
            convertirNumero(valor);

        } else if (
          tipoDatos === "productos" &&
          (
            campo === "costo" ||
            campo === "precio"
          )
        ) {
          registro[campo] =
            String(valor ?? "");

        } else {
          registro[campo] = valor;
        }
        }
      );

      if (tipoDatos === "productos") {
            return {
              id: idsImportacion[indice],
              codigo: String(registro.codigo ?? ""),
              sku: String(registro.sku ?? ""),
              nombre: String(registro.nombre ?? ""),
              categoria: String(registro.categoria ?? ""),
              stock: convertirNumero(registro.stock),
              stockMinimo: convertirNumero(registro.stockMinimo),
              costo: String(registro.costo ?? ""),
              precio: String(registro.precio ?? ""),
            };
          }


          if (tipoDatos === "clientes") {
            return {
              id: idsImportacion[indice],
              codigo: String(registro.codigo ?? ""),
              nombre: String(registro.nombre ?? ""),
              dni: String(registro.dni ?? ""),
              email: String(registro.email ?? ""),
              telefono: String(registro.telefono ?? ""),
            };
          }

          if (tipoDatos === "proveedores") {
            return {
              id: idsImportacion[indice],
              empresa: String(registro.empresa ?? ""),
              contacto: String(registro.contacto ?? ""),
              email: String(registro.email ?? ""),
              telefono: String(registro.telefono ?? ""),
            };
          }

            return {
              id: idsImportacion[indice],
              ...registro,
            };
    });

  const datosExistentes =
  cargarDatos<Record<string, unknown>>(
    tipoDatos
  );

    let registrosFinales = registrosImportados;
    let registrosDuplicados = 0;

    if (tipoDatos === "productos") {
      const nuevosProductos = registrosImportados.filter(
        (producto) =>
          !existeProducto(
            datosExistentes,
            producto
          )
      );

      registrosDuplicados =
        registrosImportados.length -
        nuevosProductos.length;

      registrosFinales = nuevosProductos;
    }

    guardarDatos(
      tipoDatos,
      [
        ...datosExistentes,
        ...registrosFinales,
      ]
    );

  eliminarImportacion(
    "importacion_pendiente"
  );

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
  `Importación completada. Se importaron ${registrosFinales.length} registros.${
    registrosDuplicados > 0
      ? ` Se omitieron ${registrosDuplicados} registros duplicados.`
      : ""
  }`
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
  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-5">

    <p className="text-yellow-400 font-semibold">
      No pudimos determinar automáticamente el tipo de información.
    </p>

    <p className="text-gray-400 text-sm mt-1 mb-5">
      Las columnas de este archivo no coinciden con una estructura
      conocida de StockFlow. Seleccioná manualmente qué tipo de
      información contiene.
    </p>

    <div className="max-w-md">

      <label className="block text-gray-400 text-sm mb-2">
        Tipo de información
      </label>

      <select
        value={tipoDatosManual || ""}
        onChange={(e) => {
          setTipoDatosManual(
            e.target.value
              ? (e.target.value as TipoDatos)
              : null
          );
        }}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
      >

        <option value="">
          Seleccioná un tipo
        </option>

        <option value="productos">
          Productos
        </option>

        <option value="clientes">
          Clientes
        </option>

        <option value="proveedores">
          Proveedores
        </option>

        <option value="ventas">
          Ventas
        </option>

      </select>

    </div>

  </div>
)}

      </div>
    )}

    </>
  );
}