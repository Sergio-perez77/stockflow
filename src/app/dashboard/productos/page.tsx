"use client"

import { useState } from "react";
import ProductModal from "@/components/dashboard/ProductModal";
import { useLocalStorage } from "@/hooks/useLocalStorage";


import type { Producto } from "@/types/producto";
import { generarCodigo } from "@/lib/generadorCodigos";



export default function ProductosPage() {

  const {
  datos: productos,
  setDatos: setProductos,
} = useLocalStorage<Producto>("productos");

 

  const [openModal, setOpenModal] = useState(false);

  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const [busqueda, setBusqueda] = useState("");

  const [categoria, setCategoria] = useState("Todas");

 


  function guardarProducto(producto: {
  nombre: string;
  sku: string;
  categoria: string;
  costo: string;
  stock: number;
  stockMinimo: number;
  precio: string;
}) {

  if (productoEditando) {
    setProductos(
      productos.map((p) =>
        p.id === productoEditando.id
          ? { ...productoEditando, ...producto }
          : p
      )
    );
  } else {
    setProductos([
      ...productos,
      {
        id: Date.now(),
        codigo: generarCodigo(
          "PROD",
          productos.map((p) => p.codigo)
        ),
        ...producto,
      }
    ]);
  }




  setProductoEditando(null);
  setOpenModal(false);
}

function eliminarProducto(id: number) {
  const nuevosProductos = productos.filter(
    (p) => p.id !== id
  );

  setProductos(nuevosProductos);
}


const categorias = [
  "Todas",
  ...new Set(productos.map((producto) => producto.categoria)),
];


const productosFiltrados = productos.filter((producto) => {
  const texto = busqueda.toLowerCase();

  const coincideBusqueda =
    producto.nombre.toLowerCase().includes(texto) ||
    producto.codigo.toLowerCase().includes(texto);

  const coincideCategoria =
    categoria === "Todas" ||
    producto.categoria === categoria;

  return coincideBusqueda && coincideCategoria;
});

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">
          Productos
        </h1>

        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
        </div>

            <button
                onClick={() => setOpenModal(true)}
                className="bg-cyan-500 hover:bg-cyan-600 px-5 py-3 rounded-lg font-semibold"
                >
                + Nuevo producto
            </button>

        
      </div>


      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <table className="w-full">
          <thead className="border-b border-slate-700 text-gray-400">
            <tr>
              <th className="text-left pb-4">
                Código
              </th>
              <th className="text-left pb-4">Producto</th>
              <th className="text-left pb-4">Categoría</th>
              <th className="text-left pb-4">Stock</th>
              <th className="text-left pb-4">Costo</th>
              <th className="text-left pb-4">Precio</th>
              <th className="text-left pb-4">Estado</th>
              <th className="text-left pb-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.map((producto) => (
              <tr
                key={producto.id}
                className="border-b border-slate-800"
              >
                <td className="py-4 font-mono text-cyan-400">
                  {producto.codigo}
                </td>
                <td className="py-4">{producto.nombre}</td>
                <td>{producto.categoria}</td>
                <td>{producto.stock}</td>
                <td>{producto.costo}</td>
                <td>{producto.precio}</td>
                <td>
                  {producto.stock === 0 ? (
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                      Sin stock
                    </span>
                  ) : producto.stock <= producto.stockMinimo ? (
                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                      Stock bajo
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                      Disponible
                    </span>
                  )}
                </td>

                <td className="space-x-2">
                  <button
                    onClick={() => {
                      setProductoEditando(producto);
                      setOpenModal(true);
                    }}
                    className="bg-cyan-500 px-3 py-1 rounded hover:bg-cyan-600"
                    >
                    Editar
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar este producto?")) {
                        eliminarProducto(producto.id);
                      }
                    }}
                    className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        <ProductModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setProductoEditando(null);
          }}
          onSave={guardarProducto}
          producto={productoEditando}
        />
    </>
  );
}