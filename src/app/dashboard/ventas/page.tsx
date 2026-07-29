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

  function agregarAlCarrito() {
  if (!productoSeleccionado) {
    alert("Seleccioná un producto.");
    return;
  }

  const producto = obtenerProductoPorId(
    productos,
    Number(productoSeleccionado)
  );

  if (!producto) return;

  if (!hayStock(producto, cantidad)) {
    alert("No hay stock suficiente.");
    return;
  }

  setCarrito([
    ...carrito,
    {
      productoId: producto.id,
      producto: producto.nombre,
      cantidad,
      precio: Number(producto.precio.replace("$", "")),
      subtotal:
        Number(producto.precio.replace("$", "")) *
        cantidad,
    },
  ]);

  setProductoSeleccionado("");
  setCantidad(1);
}

  function registrarVenta() {
  if (!productoSeleccionado) {
    alert("Seleccioná un producto.");
    return;
  }

  if (!clienteSeleccionado) {
  alert("Seleccioná un cliente.");
  return;
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

  const nuevosProductos = descontarStock(
  productos,
  producto.id,
  cantidad,
);

setProductos(nuevosProductos);



  const nuevaVenta = crearVenta(
  clienteSeleccionado,
  producto,
  cantidad,
);

  setVentas([...ventas, nuevaVenta]);

  setProductoSeleccionado("");
  setClienteSeleccionado("");
  setCantidad(1);
}

  return (
   <>
  <h1 className="text-4xl font-bold text-white mb-8">
    Ventas
  </h1>

  <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 max-w-xl">

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

            <div className="flex justify-between items-center mt-6">

            <h3 className="text-xl font-bold">

            Total

            </h3>

            <p className="text-2xl font-bold text-cyan-400">

            ${totalCarrito}

            </p>

            </div>

            <button

            className="mt-6 w-full bg-green-600 hover:bg-green-700 rounded-lg py-3 font-bold"

            >

            Confirmar venta

            </button>

            </div>

            )}

    </div>

    <div className="mt-10 bg-slate-900 rounded-xl border border-slate-800 p-6">

        <h2 className="text-2xl font-bold mb-6">
          Historial de ventas
        </h2>

        <table className="w-full">

          <thead className="border-b border-slate-700 text-gray-400">

            <tr>
              <th className="text-left pb-4">Cliente</th>
              <th className="text-left pb-4">Fecha</th>
              <th className="text-left pb-4">Producto</th>
              <th className="text-left pb-4">Cantidad</th>
              <th className="text-left pb-4">Total</th>
            </tr>

          </thead>

          <tbody>

            {ventas.map((venta) => (

              <tr
                key={venta.id}
                className="border-b border-slate-800"
              >

                <td className="py-4">
                  {venta.fecha}
                </td>

                <td>
                  {venta.cliente}
                </td>

                <td>
                  {venta.items
                    ? venta.items.map((item) => item.producto).join(", ")
                    : "-"}
                </td>

                <td>
                  {venta.items
                    ? venta.items.reduce(
                        (total, item) => total + item.cantidad,
                        0
                      )
                    : "-"}
                </td>

                <td>
                  ${venta.total}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

    </div>

  </div>
</>
  )
}