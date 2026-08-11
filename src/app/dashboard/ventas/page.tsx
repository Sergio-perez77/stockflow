"use client";

import { useState } from "react";

import { useLocalStorage } from "@/hooks/useLocalStorage";

import type { Producto } from "@/types/producto";
import type { Venta } from "@/types/venta";

import type { Cliente } from "@/types/cliente";

import {
  crearVenta,
  descontarStock,
  hayStock,
} from "@/services/ventas";

import {
  obtenerProductoPorId,
} from "@/services/productos";

import ComprobanteVenta from "@/components/ventas/ComprobanteVenta";



export default function VentasPage() {
  const {
  datos: ventas,
  setDatos: setVentas,
} = useLocalStorage<Venta>("ventas");

  const {
    datos: productos,
    setDatos: setProductos,
  } = useLocalStorage<Producto>("productos");

  const {
  datos: clientes,
} = useLocalStorage<Cliente>("clientes");

  const [productoSeleccionado, setProductoSeleccionado] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState("");

  const [metodoPago, setMetodoPago] = useState("Efectivo");

  const [estadoVenta, setEstadoVenta] = useState<
    "Pagada" | "Pendiente"
    >("Pagada");

  const [observaciones, setObservaciones] = useState("");

  const [buscarVenta, setBuscarVenta] = useState("");

  const [ventaSeleccionada, setVentaSeleccionada] =
  useState<Venta | null>(null);

  const [modalComprobante, setModalComprobante] =
  useState(false);

  const [modalDetalleAbierto, setModalDetalleAbierto] =
  useState(false);

  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [filtroMetodoPago, setFiltroMetodoPago] = useState("Todos");

  const [filtroCliente, setFiltroCliente] = useState("Todos");

  const [filtroFecha, setFiltroFecha] = useState("");

  const [ordenVentas, setOrdenVentas] =
  useState("Más reciente");

  const [cantidad, setCantidad] = useState(1);

  const [carrito, setCarrito] = useState<
  {
    productoId: number;
    producto: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[]
    >([]);

  const productoActual = productos.find(
  (p) => p.id === Number(productoSeleccionado)
);

  const totalCarrito = carrito.reduce(
  (total, item) => total + item.subtotal,
  0
);

const cantidadProductos = carrito.reduce(
  (total, item) => total + item.cantidad,
  0
);

const productosDistintos = carrito.length;

  function agregarAlCarrito() {
  if (!productoSeleccionado) {
    alert("Seleccioná un producto.");
    return;

  if (cantidad <= 0) {
  alert("La cantidad debe ser mayor a 0.");
  return;
}
  
  }

  const producto = obtenerProductoPorId(
    productos,
    Number(productoSeleccionado)
  );

  if (!producto) return;

  if (producto.stock === 0) {
  alert("Este producto no tiene stock.");
  return;
}

  if (!hayStock(producto, cantidad)) {
    alert("No hay stock suficiente.");
    return;
  }

  const existente = carrito.find(
  (item) => item.productoId === producto.id
);

if (existente) {

  if (!hayStock(producto, existente.cantidad + cantidad)) {
  alert("No hay stock suficiente.");
  return;
}

  setCarrito(
    carrito.map((item) =>
      item.productoId === producto.id
        ? {
            ...item,
            cantidad: item.cantidad + cantidad,
            subtotal:
              (item.cantidad + cantidad) *
              item.precio,
          }
        : item
    )
  );
} else {
  setCarrito([
    ...carrito,
    {
      productoId: producto.id,
      producto: producto.nombre,
      cantidad,
      precio: Number(
        producto.precio.replace("$", "")
      ),
      subtotal:
        Number(
          producto.precio.replace("$", "")
        ) * cantidad,
    },
  ]);
}

  setProductoSeleccionado("");
  setCantidad(1);
}

 function registrarVenta() {
  if (!clienteSeleccionado) {
    alert("Seleccioná un cliente.");
    return;
  }

  

  if (carrito.length === 0) {
    alert("Agregá al menos un producto al carrito.");
    return;
  }

 

  for (const item of carrito) {
  const producto = obtenerProductoPorId(
    productos,
    item.productoId
  );

  if (!producto) {
    alert(`No se encontró ${item.producto}.`);
    return;
  }

  if (!hayStock(producto, item.cantidad)) {
    alert(
      `No hay stock suficiente para ${item.producto}.`
    );
    return;
  }
}

  const nuevosProductos = descontarStock(
    productos,
    carrito
  );

setProductos(nuevosProductos);



  

  const nuevaVenta: Venta = {
    id: Date.now(),
    codigo: `VTA-${Date.now()}`,
    cliente: clienteSeleccionado,
    fecha: new Date().toLocaleDateString().split("T")[0],
    metodoPago,
    estado: estadoVenta,
    observaciones,
    items: carrito,
    total: totalCarrito,
  };

  setVentas([...ventas, nuevaVenta]);

  setCarrito([]);
  setProductoSeleccionado("");
  setClienteSeleccionado("");
  setCantidad(1);
  setMetodoPago("Efectivo");
  setEstadoVenta("Pagada");
  setObservaciones("");
}

function anularVenta(id: number) {
  if (!confirm("¿Deseás anular esta venta?")) {
  return;
}
  const venta = ventas.find((v) => v.id === id);

  if (!venta) return;

  if (venta.estado === "Anulada") return;

  const productosActualizados = [...productos];

  venta.items.forEach((item) => {
    const index = productosActualizados.findIndex(
      (p) => p.id === item.productoId
    );

    if (index !== -1) {
      productosActualizados[index] = {
        ...productosActualizados[index],
        stock:
          productosActualizados[index].stock +
          item.cantidad,
      };
    }
  });

  setProductos(productosActualizados);

  setVentas(
    ventas.map((v) =>
      v.id === id
        ? {
            ...v,
            estado: "Anulada",
          }
        : v
    )
  );
}

const ventasFiltradas = ventas.filter((venta) => {
  const texto = buscarVenta.toLowerCase();

  const coincideBusqueda =
    venta.codigo.toLowerCase().includes(texto) ||
    venta.cliente.toLowerCase().includes(texto) ||
    venta.items.some((item) =>
      item.producto.toLowerCase().includes(texto)
    );

  const coincideEstado =
    filtroEstado === "Todos" ||
    venta.estado === filtroEstado;

  const coincideMetodo =
    filtroMetodoPago === "Todos" ||
    venta.metodoPago === filtroMetodoPago;

  const coincideCliente =
  filtroCliente === "Todos" ||
  venta.cliente === filtroCliente;

  const coincideFecha =
  filtroFecha === "" ||
  venta.fecha === filtroFecha;

  return (
    coincideBusqueda &&
    coincideEstado &&
    coincideMetodo &&
    coincideCliente &&
    coincideFecha 
  );
});

const ventasOrdenadas = [...ventasFiltradas].sort(
  (a, b) => {
    switch (ordenVentas) {
      case "Más antigua":
        return a.id - b.id;

      case "Mayor importe":
        return b.total - a.total;

      case "Menor importe":
        return a.total - b.total;

      default:
        return b.id - a.id;
    }
  }
);

  return (
   <>
  <h1 className="text-4xl font-bold text-white mb-8">
    Ventas
  </h1>

  <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-full">

    <div className="space-y-4">

      <select
        value={productoSeleccionado}
        onChange={(e) => setProductoSeleccionado(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
      >
        <option value="">Seleccionar producto</option>

        {productos.map((producto) => (
          <option
            key={producto.id}
            value={producto.id}
          >
            {producto.nombre} - Stock: {producto.stock}
          </option>
        ))}
      </select>

      <select
        value={clienteSeleccionado}
        onChange={(e) => setClienteSeleccionado(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
      >
        <option value="">Seleccionar cliente</option>

        {clientes.map((cliente) => (
          <option
            key={cliente.id}
            value={cliente.nombre}
          >
            {cliente.nombre}
          </option>
        ))}
      </select>


      <select
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
      >
        <option>Efectivo</option>
        <option>Débito</option>
        <option>Crédito</option>
        <option>Transferencia</option>
        <option>Mercado Pago</option>
        <option>Cuenta Corriente</option>
      </select>


      <select
        value={estadoVenta}
        onChange={(e) =>
          setEstadoVenta(
            e.target.value as "Pagada" | "Pendiente"
          )
        }
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
      >
        <option value="Pagada">
          Pagada
        </option>

        <option value="Pendiente">
          Pendiente
        </option>
      </select>

      

      <textarea
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Observaciones (opcional)"
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 resize-none"
      />


      {productoActual && (
        <p className="text-sm text-gray-400">
          Stock disponible:{" "}
          <span className="text-cyan-400 font-semibold">
            {productoActual.stock}
          </span>
        </p>
      )}

      <input
        type="number"
        min="1"
        max={productoActual?.stock || 1}
        value={cantidad}
        onChange={(e) => setCantidad(Number(e.target.value))}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
      />

      <button
        onClick={agregarAlCarrito}
        className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-semibold"
      >
        Agregar al Carrito
      </button>


      {carrito.length > 0 && (

            <div className="mt-8 border border-slate-800 rounded-xl p-5">

            <h2 className="text-xl font-bold mb-4">
            Carrito
            </h2>

            <table className="w-full">

            <thead className="border-b border-slate-700">

            <tr>

            <th className="text-left pb-3">
            Producto
            </th>

            <th className="text-left pb-3">
            Cant.
            </th>

            <th className="text-left pb-3">
            Precio
            </th>

            <th className="text-left pb-3">
            Subtotal
            </th>

            <th className="text-left pb-3">
            </th>

            </tr>

            </thead>

            <tbody>

            {carrito.map((item,index)=>(

            <tr
            key={index}
            className="border-b border-slate-800"
            >

            <td className="py-3">
            {item.producto}
            </td>

            <td>
            {item.cantidad}
            </td>

            <td>
            ${item.precio}
            </td>

            <td>
            ${item.subtotal}
            </td>

            <td>

            <button

            onClick={()=>

            setCarrito(

            carrito.filter((_,i)=>i!==index)

            )

            }

            className="text-red-400"

            >

            ✕

            </button>

            </td>

            </tr>

            ))}

            </tbody>

            </table>

            <div className="bg-slate-800 rounded-lg p-4 mb-6">

              <div className="flex justify-between mb-2">

                <span>Productos distintos</span>

                <strong>{productosDistintos}</strong>

              </div>

              <div className="flex justify-between mb-2">

                <span>Unidades</span>

                <strong>{cantidadProductos}</strong>

              </div>

              <div className="flex justify-between">

                <span>Total</span>

                <strong className="text-cyan-400">
                  ${totalCarrito}
                </strong>

              </div>

            </div>

            <div className="flex justify-between items-center mt-6">

            <h3 className="text-xl font-bold">

            Total

            </h3>

            <p className="text-2xl font-bold text-cyan-400">

            ${totalCarrito}

            </p>

            </div>

            <button
              onClick={registrarVenta}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 rounded-lg py-3 font-bold"
            >
              Confirmar venta
            </button>

            </div>

            )}

    </div>

    <div className="mt-10 bg-slate-900 rounded-xl border border-slate-800 p-6 w-full">

        <h2 className="text-2xl font-bold mb-6">
          Historial de ventas
        </h2>


        <input
          type="text"
          value={buscarVenta}
          onChange={(e) => setBuscarVenta(e.target.value)}
          placeholder="Buscar por código, cliente o producto..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 mb-6"
        />

        <div className="flex flex-wrap gap-4 mb-6">

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          >
            <option>Todos</option>
            <option>Pagada</option>
            <option>Pendiente</option>
            <option>Anulada</option>
          </select>

          <select
            value={filtroMetodoPago}
            onChange={(e) =>
              setFiltroMetodoPago(e.target.value)
            }
            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          >
            <option>Todos</option>
            <option>Efectivo</option>
            <option>Débito</option>
            <option>Crédito</option>
            <option>Transferencia</option>
            <option>Mercado Pago</option>
            <option>Cuenta Corriente</option>
          </select>

          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          >
            <option value="Todos">Todos los clientes</option>

            {[...new Set(ventas.map((v) => v.cliente))].map(
              (cliente) => (
                <option
                  key={cliente}
                  value={cliente}
                >
                  {cliente}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <select
            value={ordenVentas}
            onChange={(e) => setOrdenVentas(e.target.value)}
            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          >
            <option>Más reciente</option>
            <option>Más antigua</option>
            <option>Mayor importe</option>
            <option>Menor importe</option>
          </select>

        </div>

      <div className="max-h-[600px] overflow-y-auto     rounded-lg"></div>

        <table className="w-full table-fixed">

          <thead className="border-b border-slate-700 text-gray-400">

            <tr>
              <th className="px-2 pb-4 text-left w-[120px]">
                Cliente
              </th>

              <th className="px-2 pb-4 text-left w-[90px]">
                Fecha
              </th>

              <th className="px-2 pb-4 text-left w-[120px]">
                Método de pago
              </th>

              <th className="px-2 pb-4 text-left">
                Producto
              </th>

              <th className="px-2 pb-4 text-center w-[70px]">
                Cantidad
              </th>

              <th className="px-2 pb-4 text-right w-[90px]">
                Total
              </th>

              <th className="px-2 pb-4 text-center w-[90px]">
                Estado
              </th>

              <th className="px-2 pb-4 text-center w-[110px]">
                Acciones
              </th>
            </tr>

          </thead>

          <tbody>

            {ventasOrdenadas.map((venta) => (

              <tr
                key={venta.id}
                className="border-b border-slate-800"
              >

                <td className="px-4 py-4 w-[180px]">
                  <div className="truncate">
                    {venta.cliente}
                  </div>
                </td>

                <td className="px-2 py-4 whitespace-nowrap">
                  {venta.fecha}
                </td>

                <td className="px-4 py-4 whitespace-nowrap">
                  {venta.metodoPago}
                </td>

                <td className="px-4 py-4">

                  {venta.items.length === 1
                    ? venta.items[0].producto
                    : `${venta.items.length} productos`}

                </td>

                <td className="text-center">
                  {venta.items
                    ? venta.items.reduce(
                        (total, item) => total + item.cantidad,
                        0
                      )
                    : "-"}
                </td>

                <td className="px-4 py-4 text-right font-semibold">
                  ${venta.total}
                </td>

                <td className="px-4 py-4 text-center">
                  <span
                    className={
                      venta.estado === "Pagada"
                        ? "text-green-400 font-semibold"
                        : "text-yellow-400 font-semibold"
                    }
                  >
                    {venta.estado}
                  </span>
                </td>



                <td className="px-4 py-4">

                  <div className="flex flex-col gap-2 items-center">

                    <button
                      onClick={() => {
                        setVentaSeleccionada(venta);
                        setModalComprobante(true);
                      }}
                      className="min-w-[110px] bg-cyan-600 hover:bg-cyan-700 px-3 py-1 text-xs rounded-md"
                    >
                      Comprobante
                    </button>

                    {venta.estado !== "Anulada" && (
                      <button
                        onClick={() => anularVenta(venta.id)}
                        className="w-full bg-red-600 hover:bg-red-700 px-2 py-1 text-xs rounded-md"
                      >
                        Anular
                      </button>
                    )}

                  </div>

                </td>

                
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  

  {modalComprobante && ventaSeleccionada && (

  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

    <div className="bg-slate-900 rounded-xl p-6 max-h-[90vh] overflow-auto">

      <div className="flex justify-end mb-4">

        <button
          onClick={() => setModalComprobante(false)}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
        >
          Cerrar
        </button>

      </div>

      <ComprobanteVenta
        venta={ventaSeleccionada}
      />

    </div>

  </div>

)}
</>
  )
}