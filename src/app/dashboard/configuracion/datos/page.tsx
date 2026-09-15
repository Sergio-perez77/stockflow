"use client";

import { generarCodigo } from "@/lib/generadorCodigos";

import {
  convertirNumero,
  obtenerNumero,
} from "@/lib/numeros";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";

import {
  cargarDatos,
  guardarDatos,
  cargarImportacion,
  guardarImportacion,
  eliminarImportacion,
} from "@/lib/storage";

import type { Venta } from "@/types/venta";

import type { Cliente } from "@/types/cliente";

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
  const leerImportacionPendiente = (): ImportacionPendiente | null => {
    if (typeof window === "undefined") return null;

    return cargarImportacion<ImportacionPendiente>("importacion_pendiente");
  };

  const [archivo, setArchivo] = useState<File | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<FilaImportada[]>(() =>
    leerImportacionPendiente()?.filas ?? []
  );
  const [columnas, setColumnas] = useState<string[]>(() =>
    leerImportacionPendiente()?.columnas ?? []
  );
  const [error, setError] = useState("");

  const [importacionPendiente, setImportacionPendiente] =
    useState<ImportacionPendiente | null>(() =>
      leerImportacionPendiente()
    );

  const [mostrarMapeo, setMostrarMapeo] = useState(false);
  const [tipoDatos, setTipoDatos] = useState<
    "productos" | "clientes" | "proveedores" | "ventas" | null
  >(null);

  const [tipoDatosManual, setTipoDatosManual] =
  useState<TipoDatos | null>(null);

  const [tipoPlantilla, setTipoPlantilla] =
  useState<TipoDatos>("productos");

  const [mapeoColumnas, setMapeoColumnas] =
  useState<MapeoColumnas>({});

  const [erroresMapeo, setErroresMapeo] = useState<string[]>([]);

  const [importacionValidada, setImportacionValidada] = useState(false);
  const [ejemplosDuplicados, setEjemplosDuplicados] = useState<string[]>([]);
  const [clientesNuevosContar, setClientesNuevosContar] = useState<number>(0);

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


  function normalizarFechaImportada(
  valor: unknown
): string | null {
  if (typeof valor === "number") {
    const fechaExcel = XLSX.SSF.parse_date_code(valor);

    if (!fechaExcel) {
      return null;
    }

    const mes = String(fechaExcel.m).padStart(2, "0");
    const dia = String(fechaExcel.d).padStart(2, "0");

    return `${fechaExcel.y}-${mes}-${dia}`;
  }

  const texto = String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  const fechaIso = texto.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (fechaIso) {
    const [, anio, mes, dia] = fechaIso;

    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  const fechaLatina = texto.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (fechaLatina) {
    const [, dia, mes, anio] = fechaLatina;

    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  return null;
}

  function normalizarEstadoVenta(
  valor: unknown
): Venta["estado"] {
  const estado = String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (estado === "pendiente") {
    return "Pendiente";
  }

  if (estado === "anulada" || estado === "anulado") {
    return "Anulada";
  }

  return "Pagada";
}

  function limpiarImportacion() {
  eliminarImportacion("importacion_pendiente");

  setImportacionValidada(false);
  setMostrarMapeo(false);
  setImportacionPendiente(null);
  setFilas([]);
  setColumnas([]);
  setMapeoColumnas({});
  setErroresMapeo([]);
  setTipoDatos(null);
  setTipoDatosManual(null);
  setArchivo(null);
  if (inputArchivoRef.current) {
  inputArchivoRef.current.value = "";
}
  setError("");
}


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

  function descargarPlantilla(tipo: TipoDatos) {
  const ejemplos: Record<TipoDatos, Record<string, string | number>> = {
    productos: {
      codigo: "PROD-001",
      sku: "SKU-001",
      nombre: "Producto de ejemplo",
      categoria: "General",
      stock: 10,
      stockMinimo: 2,
      costo: 1000,
      precio: 1500,
    },
    clientes: {
      codigo: "CLI-001",
      nombre: "Cliente de ejemplo",
      dni: "30123456",
      telefono: "1122334455",
      email: "cliente@ejemplo.com",
    },
    proveedores: {
      empresa: "Proveedor de ejemplo",
      contacto: "Ana Pérez",
      telefono: "1122334455",
      email: "proveedor@ejemplo.com",
    },
    ventas: {
      codigo: "VTA-001",
      cliente: "Cliente de ejemplo",
      fecha: "2026-08-21",
      metodoPago: "Efectivo",
      estado: "Pagada",
      total: 1500,
    },
  };

  const columnasPlantilla = camposStockFlow[tipo];

  const hoja = XLSX.utils.aoa_to_sheet([
    columnasPlantilla,
    columnasPlantilla.map(
      (campo) => ejemplos[tipo][campo] ?? ""
    ),
  ]);

  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    libro,
    hoja,
    tipo.charAt(0).toUpperCase() + tipo.slice(1)
  );

  XLSX.writeFile(
    libro,
    `plantilla-stockflow-${tipo}.xlsx`
  );
}

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

  function continuarImportacion(tipoForzado?: TipoDatos) {
  if (!importacionPendiente) return;

  const tipoDetectado =
    tipoForzado ??
    detectarTipoDatos(importacionPendiente.columnas);

  setTipoDatos(tipoDetectado);
  setErroresMapeo([]);
  setImportacionValidada(false);

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

      dni: [
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

  function validarEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function validarTelefono(tel: string): boolean {
    const soloDigitos = String(tel ?? "").replace(/[^0-9]/g, "");
    return soloDigitos.length >= 7 && soloDigitos.length <= 15;
  }

  function contarClientesNuevos(): number {
    if (tipoDatos !== "ventas" || !importacionPendiente) return 0;
    const clientesExistentes = cargarDatos<Cliente>("clientes");
    const nombresExistentes = new Set(
      clientesExistentes.map((c) => c.nombre.trim().toLowerCase())
    );
    let faltantes = 0;
    importacionPendiente.filas.forEach((fila) => {
      const nombre = String(fila[mapeoColumnas.cliente] ?? "").trim();
      if (!nombre) return;
      if (!nombresExistentes.has(nombre.toLowerCase())) faltantes++;
    });
    setClientesNuevosContar(faltantes);
    return faltantes;
  }

  function validarFilasImportacion(): string[] {
  if (!tipoDatos || !importacionPendiente) {
    return [];
  }

  const camposObligatorios: Record<TipoDatos, string[]> = {
    productos: ["nombre", "stock", "precio"],
    clientes: ["nombre"],
    proveedores: ["empresa"],
    ventas: ["cliente", "fecha", "total"],
  };

  const errores: string[] = [];
  let totalErrores = 0;

  importacionPendiente.filas.forEach((fila, indice) => {
    camposObligatorios[tipoDatos].forEach((campo) => {
      const columnaOrigen = mapeoColumnas[campo];
      const valor = columnaOrigen ? fila[columnaOrigen] : "";

      if (String(valor ?? "").trim()) {
        return;
      }

      totalErrores++;

      if (errores.length < 10) {
        errores.push(
          `Fila ${indice + 2}: el campo "${campo}" está vacío.`
        );
      }
    });
  });

  // Validaciones específicas de formato (email / teléfono)
  importacionPendiente.filas.forEach((fila, indice) => {
    if (tipoDatos === "clientes" || tipoDatos === "proveedores") {
      const columnaEmail = mapeoColumnas.email;
      const columnaTelefono = mapeoColumnas.telefono;

      const valorEmail = columnaEmail
        ? String(fila[columnaEmail] ?? "").trim()
        : "";

      if (valorEmail && !validarEmail(valorEmail) && errores.length < 10) {
        errores.push(
          `Fila ${indice + 2}: el campo "email" tiene un formato inválido.`
        );
      }

      const valorTel = columnaTelefono
        ? String(fila[columnaTelefono] ?? "").trim()
        : "";

      if (valorTel && !validarTelefono(valorTel) && errores.length < 10) {
        errores.push(
          `Fila ${indice + 2}: el campo "telefono" tiene un formato inválido.`
        );
      }
    }
  });

  if (totalErrores > errores.length) {
    errores.push(
      `Hay ${totalErrores - errores.length} errores adicionales.`
    );
  }

  return errores;
}


  function validarNumerosImportacion(): string[] {
  if (!tipoDatos || !importacionPendiente) {
    return [];
  }

  const camposNumericos: Partial<Record<TipoDatos, string[]>> = {
    productos: ["stock", "stockMinimo", "costo", "precio"],
    ventas: ["total"],
  };

  const errores: string[] = [];

  importacionPendiente.filas.forEach((fila, indice) => {
    (camposNumericos[tipoDatos] ?? []).forEach((campo) => {
      const columnaOrigen = mapeoColumnas[campo];

      if (!columnaOrigen) {
        return;
      }

      const valor = fila[columnaOrigen];

      if (
        String(valor ?? "").trim() &&
        obtenerNumero(valor) === null &&
        errores.length < 10
      ) {
        errores.push(
          `Fila ${indice + 2}: "${campo}" debe ser un número válido.`
        );
      }
    });
  });

  return errores;
}

  function validarRangosNumericos(): string[] {
  if (!tipoDatos || !importacionPendiente) {
    return [];
  }

  const camposSinNegativos: Partial<
    Record<TipoDatos, string[]>
  > = {
    productos: [
      "stock",
      "stockMinimo",
      "costo",
      "precio",
    ],
    ventas: ["total"],
  };

  const errores: string[] = [];

  importacionPendiente.filas.forEach((fila, indice) => {
    (camposSinNegativos[tipoDatos] ?? []).forEach(
      (campo) => {
        const columnaOrigen = mapeoColumnas[campo];

        if (!columnaOrigen) {
          return;
        }

        const valor = fila[columnaOrigen];

        if (!String(valor ?? "").trim()) {
          return;
        }

        const numero = obtenerNumero(valor);

        if (numero !== null) {
          if (numero < 0 && errores.length < 10) {
            errores.push(
              `Fila ${indice + 2}: "${campo}" no puede ser negativo.`
            );
          }

          // Algunos campos deben ser mayores que cero
          if (
            (campo === "precio" || campo === "costo" || campo === "total") &&
            numero <= 0 &&
            errores.length < 10
          ) {
            errores.push(
              `Fila ${indice + 2}: "${campo}" debe ser mayor que cero.`
            );
          }
        }
      }
    );
  });

  return errores;
}


  function validarClientesDeVentas(): string[] {
  if (tipoDatos !== "ventas" || !importacionPendiente) {
    return [];
  }

  // Cuando se importa una venta, si el cliente no existe se crea
  // automáticamente para no bloquear una carga válida del negocio.
  return [];
}

  function generarClavesDuplicadas(
    valores: Array<string | undefined>
  ): string[] {
    return valores
      .map((valor) =>
        String(valor ?? "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      )
      .filter(Boolean);
  }

  function obtenerClavesDuplicadasPorTipo(
    tipo: TipoDatos,
    registro: Record<string, unknown>
  ): string[] {
    if (tipo === "productos") {
      return generarClavesDuplicadas([
        String(registro.sku ?? registro.codigo ?? ""),
      ]);
    }

    if (tipo === "clientes") {
      return generarClavesDuplicadas([
        String(registro.dni ?? ""),
        String(registro.email ?? ""),
        String(registro.nombre ?? ""),
      ]);
    }

    if (tipo === "proveedores") {
      return generarClavesDuplicadas([
        String(registro.empresa ?? ""),
        String(registro.contacto ?? ""),
        String(registro.email ?? ""),
        String(registro.telefono ?? ""),
      ]);
    }

    return generarClavesDuplicadas([
      String(registro.codigo ?? ""),
      String(registro.cliente ?? ""),
      String(registro.fecha ?? ""),
    ]);
  }

  function calcularEjemplosDuplicados() {
    if (!tipoDatos || !importacionPendiente) return;

    const datosExistentes = cargarDatos<Record<string, unknown>>(tipoDatos);

    const obtenerClaveRegistro = (
      fila: Record<string, unknown>
    ) => {
      if (tipoDatos === "productos") {
        return String(
          fila[mapeoColumnas.sku] ?? fila[mapeoColumnas.codigo] ?? ""
        )
          .trim()
          .toLowerCase();
      }

      return obtenerClavesDuplicadasPorTipo(
        tipoDatos,
        {
          ...fila,
          sku: fila[mapeoColumnas.sku],
          codigo: fila[mapeoColumnas.codigo],
          empresa: fila[mapeoColumnas.empresa],
          contacto: fila[mapeoColumnas.contacto],
          email: fila[mapeoColumnas.email],
          telefono: fila[mapeoColumnas.telefono],
          dni: fila[mapeoColumnas.dni],
          nombre: fila[mapeoColumnas.nombre],
          cliente: fila[mapeoColumnas.cliente],
          fecha: fila[mapeoColumnas.fecha],
        }
      ).join("|");
    };

    const clavesExistentes = new Set<string>();
    datosExistentes.forEach((ex) => {
      const clave = String(
        (ex as Record<string, any>).sku ?? (ex as Record<string, any>).codigo ?? ""
      )
        .trim()
        .toLowerCase();

      if (clave) clavesExistentes.add(clave);
    });

    const ejemplos: string[] = [];

    importacionPendiente.filas.forEach((fila) => {
      const clave = obtenerClaveRegistro(fila);

      if (!clave) return;

      if (clavesExistentes.has(clave)) {
        if (!ejemplos.includes(clave)) ejemplos.push(clave);
      }
    });

    setEjemplosDuplicados(ejemplos);
  }

    function descargarDuplicadosCSV() {
      if (typeof window === "undefined") return;
      if (!ejemplosDuplicados || ejemplosDuplicados.length === 0) return;

      const filas = ejemplosDuplicados.map((clave, idx) => `${idx + 1},"${clave.replace(/"/g, '""') }"`).join("\n");
      const csv = `id,clave\n${filas}`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `duplicados-${tipoDatos}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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
    "cliente",
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

  errores.push(...validarFilasImportacion());
  errores.push(...validarNumerosImportacion());
  errores.push(...validarRangosNumericos());
  errores.push(...validarClientesDeVentas());
  // Contar clientes nuevos (info, no bloqueante)
  try {
    contarClientesNuevos();
  } catch (e) {
    console.error(e);
  }
  if (tipoDatos === "ventas") {
  importacionPendiente?.filas.forEach((fila, indice) => {
    const columnaFecha = mapeoColumnas.fecha;
    const valorFecha = columnaFecha
      ? fila[columnaFecha]
      : "";

    if (String(valorFecha ?? "").trim()) {
      const fechaNorm = normalizarFechaImportada(valorFecha);

      if (!fechaNorm) {
        errores.push(
          `Fila ${indice + 2}: la fecha no tiene un formato válido.`
        );
        return;
      }

      // No permitir fechas futuras
      try {
        const fechaObj = new Date(fechaNorm + "T00:00:00Z");
        const hoy = new Date();
        // comparar solo fecha (sin hora)
        const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        if (fechaObj.getTime() > hoySinHora.getTime()) {
          errores.push(
            `Fila ${indice + 2}: la fecha no puede ser mayor a la fecha actual.`
          );
        }
      } catch (e) {
        // si la conversión falla, no bloquear por esto aquí
      }
    }
  });
}

  setErroresMapeo(errores);

  if (errores.length > 0) {
    setImportacionValidada(false);
    return false;
  }

  setImportacionValidada(true);
  // Calcular ejemplos de duplicados para mostrar en la UI
  try {
    calcularEjemplosDuplicados();
  } catch (e) {
    // no bloquear la validación por errores en cálculo de ejemplos
    console.error(e);
  }

  return true;
}

  function importarDatos(forceImport = false) {
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
    const clientesExistentes = cargarDatos<Cliente>("clientes");
    const clientesPorNombre = new Map(
      clientesExistentes.map((cliente) => [
        cliente.nombre.trim().toLowerCase(),
        cliente,
      ])
    );

    const clientesNuevos: Cliente[] = [];

    importacionPendiente.filas.forEach((fila) => {
      const nombreCliente = String(
        fila[mapeoColumnas.cliente] ?? ""
      ).trim();

      if (!nombreCliente) {
        return;
      }

      const claveCliente = nombreCliente.toLowerCase();

      if (clientesPorNombre.has(claveCliente)) {
        return;
      }

      const [nuevoId] = generarIdsImportacion(
        "clientes",
        1
      );

      const clienteNuevo: Cliente = {
        id: nuevoId,
        codigo: generarCodigo(
          "CLI",
          clientesExistentes.map((cliente) => cliente.codigo)
        ),
        nombre: nombreCliente,
        dni: "",
        email: "",
        telefono: "",
      };

      clientesExistentes.push(clienteNuevo);
      clientesPorNombre.set(claveCliente, clienteNuevo);
      clientesNuevos.push(clienteNuevo);
    });

    if (clientesNuevos.length > 0) {
      guardarDatos("clientes", clientesExistentes);
    }

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
        normalizarFechaImportada(
          fila[mapeoColumnas.fecha]
        ) ?? "";

        const metodoPago =
          String(
            fila[mapeoColumnas.metodoPago] ?? ""
          );

        const estado = normalizarEstadoVenta(
          fila[mapeoColumnas.estado]
        );

        const total = convertirNumero(
          fila[mapeoColumnas.total]
        );

        return {
          id: idsImportacion[indice],

          codigo,

          cliente: String(cliente ?? "").trim(),


          fecha,

          metodoPago: String(metodoPago ?? "").trim(),

          estado,

          observaciones: "",

          items: [],

          total,
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

    limpiarImportacion();

    alert(
      `Importación completada. Se importaron ${ventasImportadas.length} ventas.${
        clientesNuevos.length > 0
          ? ` Se crearon ${clientesNuevos.length} clientes nuevos.`
          : ""
      }`
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
              codigo: String(registro.codigo ?? "").trim(),
              sku: String(registro.sku ?? "").trim(),
              nombre: String(registro.nombre ?? "").trim(),
              categoria: String(registro.categoria ?? "").trim(),
              stock: convertirNumero(registro.stock),
              stockMinimo: convertirNumero(registro.stockMinimo),
              costo: String(registro.costo ?? "").trim(),
              precio: String(registro.precio ?? "").trim(),
            };
          }


          if (tipoDatos === "clientes") {
            return {
              id: idsImportacion[indice],
              codigo: String(registro.codigo ?? "").trim(),
              nombre: String(registro.nombre ?? "").trim(),
              dni: String(registro.dni ?? "").trim(),
              email: String(registro.email ?? "").trim(),
              telefono: String(registro.telefono ?? "").trim(),
            };
          }

          if (tipoDatos === "proveedores") {
            return {
              id: idsImportacion[indice],
              empresa: String(registro.empresa ?? "").trim(),
              contacto: String(registro.contacto ?? "").trim(),
              email: String(registro.email ?? "").trim(),
              telefono: String(registro.telefono ?? "").trim(),
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

    if (!forceImport) {

    if (tipoDatos === "productos") {
    const skusRegistrados = new Set(
      datosExistentes
        .map((producto) =>
          String(producto.sku ?? "").trim().toLowerCase()
        )
        .filter(Boolean)
    );

    const nuevosProductos = registrosImportados.filter(
      (producto) => {
        const sku = String(producto.sku ?? "")
          .trim()
          .toLowerCase();

        // Un producto sin SKU no se considera duplicado.
        if (!sku) {
          return true;
        }

        if (skusRegistrados.has(sku)) {
          return false;
        }

        skusRegistrados.add(sku);
        return true;
      }
    );

  registrosDuplicados =
    registrosImportados.length -
    nuevosProductos.length;

  registrosFinales = nuevosProductos;
}

    if (tipoDatos === "clientes") {
      const clientesRegistrados = new Set<string>();

      datosExistentes.forEach((cliente) => {
        const claves = generarClavesDuplicadas([
          String(cliente.dni ?? ""),
          String(cliente.email ?? ""),
          String(cliente.nombre ?? ""),
        ]);

        claves.forEach((clave) => clientesRegistrados.add(clave));
      });

      const clientesNuevos = registrosImportados.filter((cliente) => {
        const claves = generarClavesDuplicadas([
          String(cliente.dni ?? ""),
          String(cliente.email ?? ""),
          String(cliente.nombre ?? ""),
        ]);

        if (claves.length === 0) {
          return true;
        }

        const hayDuplicado = claves.some((clave) =>
          clientesRegistrados.has(clave)
        );

        if (hayDuplicado) {
          return false;
        }

        claves.forEach((clave) => clientesRegistrados.add(clave));
        return true;
      });

      registrosDuplicados = registrosImportados.length - clientesNuevos.length;
      registrosFinales = clientesNuevos;
    }

    if (tipoDatos === "proveedores") {
      const proveedoresRegistrados = new Set<string>();

      datosExistentes.forEach((proveedor) => {
        const claves = obtenerClavesDuplicadasPorTipo("proveedores", {
          empresa: proveedor.empresa,
          contacto: proveedor.contacto,
          email: proveedor.email,
          telefono: proveedor.telefono,
        });

        claves.forEach((clave) => proveedoresRegistrados.add(clave));
      });

      const proveedoresNuevos = registrosImportados.filter((proveedor) => {
        const claves = obtenerClavesDuplicadasPorTipo("proveedores", {
          empresa: proveedor.empresa,
          contacto: proveedor.contacto,
          email: proveedor.email,
          telefono: proveedor.telefono,
        });

        if (claves.length === 0) {
          return true;
        }

        const hayDuplicado = claves.some((clave) =>
          proveedoresRegistrados.has(clave)
        );

        if (hayDuplicado) {
          return false;
        }

        claves.forEach((clave) => proveedoresRegistrados.add(clave));
        return true;
      });

      registrosDuplicados = registrosImportados.length - proveedoresNuevos.length;
      registrosFinales = proveedoresNuevos;
    }

      } else {
        // forceImport === true: no filtrado, todos los registros se importan
        registrosFinales = registrosImportados;
        registrosDuplicados = 0;
      }

      // Generar ejemplos de duplicados para mostrar al usuario
    const obtenerClaveRegistro = (
      registro: Record<string, any>,
      tipo: TipoDatos
    ) => {
      if (tipo === "productos") {
        return String(registro.sku ?? registro.codigo ?? "")
          .trim()
          .toLowerCase();
      }

      if (tipo === "clientes") {
        return generarClavesDuplicadas([
          String(registro.dni ?? ""),
          String(registro.email ?? ""),
          String(registro.nombre ?? ""),
        ]).join("|");
      }

      if (tipo === "proveedores") {
        return obtenerClavesDuplicadasPorTipo("proveedores", {
          empresa: registro.empresa,
          contacto: registro.contacto,
          email: registro.email,
          telefono: registro.telefono,
        }).join("|");
      }

      // ventas
      return obtenerClavesDuplicadasPorTipo("ventas", {
        codigo: registro.codigo,
        cliente: registro.cliente,
        fecha: registro.fecha,
      }).join("|");
    };

    const clavesEncontradas = new Set<string>();
    const ejemplosDuplicados: string[] = [];

    // Inicializar con claves existentes
    datosExistentes.forEach((ex) => {
      const clave = obtenerClaveRegistro(ex as Record<string, any>, tipoDatos);

      if (clave) clavesEncontradas.add(clave);
    });

    registrosImportados.forEach((reg) => {
      const clave = obtenerClaveRegistro(reg as Record<string, any>, tipoDatos);

      if (!clave) return;

      if (clavesEncontradas.has(clave)) {
        if (!ejemplosDuplicados.includes(clave)) {
          ejemplosDuplicados.push(clave);
        }
      } else {
        clavesEncontradas.add(clave);
      }
    });

    const mensajeConfirmacion = [
      `Se importarán ${registrosFinales.length} registros de ${tipoDatos}.`,
      registrosDuplicados > 0
        ? `Se omitirán ${registrosDuplicados} registros duplicados.`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const confirmarImportacion = window.confirm(
      `${mensajeConfirmacion}\n\n¿Deseás continuar?`
    );

    if (!confirmarImportacion) {
      return;
    }

    guardarDatos(
      tipoDatos,
      [
        ...datosExistentes,
        ...registrosFinales,
      ]
    );

    limpiarImportacion();

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
  
  function insertarImportacionEjemplo() {
    if (typeof window === "undefined") return;

    const ejemplo: ImportacionPendiente = {
      nombreArchivo: "ejemplo-ventas.xlsx",
      columnas: ["codigo", "cliente", "fecha", "total"],
      filas: [
        { codigo: "VTA-001", cliente: "Cliente A", fecha: "2026-08-25", total: 1500 },
        { codigo: "VTA-002", cliente: "Cliente B", fecha: "2026-08-24", total: 2000 },
      ],
    };

    guardarImportacion("importacion_pendiente", ejemplo);
    setImportacionPendiente(ejemplo);
    setFilas(ejemplo.filas);
    setColumnas(ejemplo.columnas);
    setArchivo(null);
    setMostrarMapeo(false);
    setImportacionValidada(false);
  }
  
    function exportarDatos(tipo: TipoDatos) {
        const datos = cargarDatos<Record<string, unknown>>(tipo);

        if (datos.length === 0) {
          alert(`No hay ${tipo} para exportar.`);
          return;
        }

        const mapRegistro = (registro: Record<string, any>) => {
          if (tipo === "productos") {
            return {
              id: registro.id,
              codigo: String(registro.codigo ?? "").trim(),
              sku: String(registro.sku ?? "").trim(),
              nombre: String(registro.nombre ?? "").trim(),
              categoria: String(registro.categoria ?? "").trim(),
              stock: registro.stock ?? "",
              stockMinimo: registro.stockMinimo ?? "",
              costo: String(registro.costo ?? "").trim(),
              precio: String(registro.precio ?? "").trim(),
            };
          }

          if (tipo === "clientes") {
            return {
              id: registro.id,
              codigo: String(registro.codigo ?? "").trim(),
              nombre: String(registro.nombre ?? "").trim(),
              dni: String(registro.dni ?? "").trim(),
              email: String(registro.email ?? "").trim(),
              telefono: String(registro.telefono ?? "").trim(),
            };
          }

          if (tipo === "proveedores") {
            return {
              id: registro.id,
              empresa: String(registro.empresa ?? "").trim(),
              contacto: String(registro.contacto ?? "").trim(),
              email: String(registro.email ?? "").trim(),
              telefono: String(registro.telefono ?? "").trim(),
            };
          }

          // ventas
          return {
            id: registro.id,
            codigo: String(registro.codigo ?? "").trim(),
            cliente: String(registro.cliente ?? "").trim(),
            fecha: String(registro.fecha ?? "").trim(),
            metodoPago: String(registro.metodoPago ?? "").trim(),
            estado: String(registro.estado ?? "").trim(),
            total: registro.total ?? "",
            items: JSON.stringify(registro.items ?? []),
            observaciones: String(registro.observaciones ?? "").trim(),
          };
        };

        const datosExportar = datos.map(mapRegistro);

        // Asegurar orden consistente de columnas por tipo
        const headersByTipo: Record<TipoDatos, string[]> = {
          productos: [
            "id",
            "codigo",
            "sku",
            "nombre",
            "categoria",
            "stock",
            "stockMinimo",
            "costo",
            "precio",
          ],
          clientes: ["id", "codigo", "nombre", "dni", "email", "telefono"],
          proveedores: ["id", "empresa", "contacto", "email", "telefono"],
          ventas: [
            "id",
            "codigo",
            "cliente",
            "fecha",
            "metodoPago",
            "estado",
            "total",
            "items",
            "observaciones",
          ],
        };

        const headers = headersByTipo[tipo];

        const hoja = XLSX.utils.json_to_sheet(datosExportar, { header: headers });
        const libro = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          libro,
          hoja,
          tipo.charAt(0).toUpperCase() + tipo.slice(1)
        );

        const fecha = new Date().toISOString().slice(0, 10);

        XLSX.writeFile(
          libro,
          `stockflow-${tipo}-${fecha}.xlsx`
        );
      }


  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-2">
        Datos
      </h1>

      <p className="text-gray-400 mb-8">
        Importá y exportá la información de tu negocio.
      </p>

      {typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <div className="mb-6">
          <button
            type="button"
            onClick={insertarImportacionEjemplo}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm border border-emerald-700"
          >
            Insertar importación de ejemplo
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (!importacionPendiente) return;
            setArchivo(null);
            setFilas(importacionPendiente.filas || []);
            setColumnas(importacionPendiente.columnas || []);
            continuarImportacion();
          }}
          disabled={!importacionPendiente}
          className={`inline-flex items-center gap-3 ${importacionPendiente ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400 cursor-not-allowed'} px-4 py-2 rounded-lg text-sm`}
        >
          <span className="font-semibold">Última importación:</span>
          <span className="truncate max-w-xs">{importacionPendiente ? importacionPendiente.nombreArchivo : '— ninguna —'}</span>
          {importacionPendiente && (
            <span className="text-slate-200 text-xs">{importacionPendiente.columnas.length} columnas • {importacionPendiente.filas.length} registros</span>
          )}
        </button>

        {importacionPendiente && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseás eliminar la importación guardada?')) {
                limpiarImportacion();
              }
            }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
          >
            Eliminar importación
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* IMPORTAR */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-2xl font-bold text-white mb-2">
            Importar datos
          </h2>

          <p className="text-gray-400 mb-6">
            Importá información desde Excel, CSV u otros archivos.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={tipoPlantilla}
              onChange={(e) =>
                setTipoPlantilla(e.target.value as TipoDatos)
              }
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
            >
              <option value="productos">Plantilla de productos</option>
              <option value="clientes">Plantilla de clientes</option>
              <option value="proveedores">Plantilla de proveedores</option>
              <option value="ventas">Plantilla de ventas</option>
            </select>

            <button
              type="button"
              onClick={() => descargarPlantilla(tipoPlantilla)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-3 rounded-lg font-semibold transition"
            >
              Descargar plantilla
            </button>
          </div>

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
                ref={inputArchivoRef}
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
              onClick={() => continuarImportacion()}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Continuar importación
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Deseás cancelar y descartar esta importación?"
                  )
                ) {
                  limpiarImportacion();
                }
              }}
              className="mt-3 text-sm text-red-400 hover:text-red-300 transition"
            >
              Cancelar importación
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
              onClick={() => exportarDatos("productos")}
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
              onClick={() => exportarDatos("clientes")}
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
              onClick={() => exportarDatos("proveedores")}
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
              onClick={() => exportarDatos("ventas")}
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

                    setImportacionValidada(false);
                    setErroresMapeo([]);
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
                onClick={() => importarDatos(false)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Importar {importacionPendiente?.filas.length || 0} registros
              </button>

            </div>

            {ejemplosDuplicados.length > 0 && (
              <div className="mt-4 bg-yellow-900/10 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  Se detectaron {ejemplosDuplicados.length} ejemplos de registros duplicados.
                </p>

                <div className="mt-2 text-sm text-white max-h-40 overflow-auto">
                  {ejemplosDuplicados.slice(0, 5).map((e, i) => (
                    <div key={i} className="py-0.5">• {e}</div>
                  ))}
                  {ejemplosDuplicados.length > 5 && (
                    <div className="text-gray-400">... y {ejemplosDuplicados.length - 5} más</div>
                  )}
                </div>

                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => descargarDuplicadosCSV()}
                    className="bg-slate-800 text-white px-3 py-2 rounded"
                  >
                    Descargar CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => importarDatos(true)}
                    className="bg-amber-600 text-white px-3 py-2 rounded"
                  >
                    Importar incluyendo duplicados
                  </button>
                </div>
              </div>
            )}

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
          const tipoSeleccionado = e.target.value as TipoDatos;

          setTipoDatosManual(tipoSeleccionado || null);

          if (!tipoSeleccionado) {
            setTipoDatos(null);
            setMapeoColumnas({});
            return;
          }

          continuarImportacion(tipoSeleccionado);
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