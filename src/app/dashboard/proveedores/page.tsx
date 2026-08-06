"use client";

import { useState } from "react";

import SupplierModal from "@/components/dashboard/SupplierModal";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Proveedor } from "@/types/proveedor";

export default function ProveedoresPage() {
  const {
    datos: proveedores,
    setDatos: setProveedores,
  } = useLocalStorage<Proveedor>("proveedores");

  const [openModal, setOpenModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [proveedorEditando, setProveedorEditando] =
    useState<Proveedor | null>(null);

  function guardarProveedor(
    proveedor: Omit<Proveedor, "id">
  ) {
    if (proveedorEditando) {
      setProveedores(
        proveedores.map((p) =>
          p.id === proveedorEditando.id
            ? { ...proveedorEditando, ...proveedor }
            : p
        )
      );
    } else {
      setProveedores([
        ...proveedores,
        {
          id: Date.now(),
          ...proveedor,
        },
      ]);
    }

    setProveedorEditando(null);
    setOpenModal(false);
  }

  function eliminarProveedor(id: number) {
    setProveedores(
      proveedores.filter((p) => p.id !== id)
    );
  }

  const proveedoresFiltrados = proveedores.filter((p) =>
    p.empresa.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-8">

        <h1 className="text-4xl font-bold text-white">
          Proveedores
        </h1>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 px-5 py-3 rounded-lg font-semibold"
        >
          + Nuevo proveedor
        </button>

      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">
            Proveedores
          </p>

          <p className="text-2xl font-bold text-white">
            {proveedores.length}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">
            Con email
          </p>

          <p className="text-2xl font-bold text-cyan-400">
            {proveedores.filter((p) => p.email).length}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">
            Con teléfono
          </p>

          <p className="text-2xl font-bold text-green-400">
            {proveedores.filter((p) => p.telefono).length}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">
            Resultados
          </p>

          <p className="text-2xl font-bold text-yellow-400">
            {proveedoresFiltrados.length}
          </p>
        </div>

      </div>

<input
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
  placeholder="Buscar proveedor..."
  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 mb-6"
/>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

        <div className="max-h-[600px] overflow-auto rounded-lg border border-slate-800">

          <table className="min-w-full">

            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 text-gray-400 z-10">
              <tr>
                <th className="px-4 pb-4 text-left">Empresa</th>
                <th className="px-4 pb-4 text-left">Contacto</th>
                <th className="px-4 pb-4 text-left">Email</th>
                <th className="px-4 pb-4 text-left">Teléfono</th>
                <th className="px-4 pb-4 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>

              {proveedoresFiltrados.map((proveedor) => (

                <tr
                  key={proveedor.id}
                  className="border-b border-slate-800"
                >

                  <td className="py-4">{proveedor.empresa}</td>
                  <td className="px-4 py-4">{proveedor.contacto}</td>
                  <td className="px-4 py-4">{proveedor.email}</td>
                  <td className="px-4 py-4">{proveedor.telefono}</td>

                <td className="px-4 py-4 w-[170px]">

                  <div className="flex flex-col gap-2">

                    <button
                      onClick={() => {
                        setProveedorEditando(proveedor);
                        setOpenModal(true);
                      }}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar este proveedor?")) {
                          eliminarProveedor(proveedor.id);
                        }
                      }}
                      className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg text-sm"
                    >
                      Eliminar
                    </button>

                  </div>

                </td>

              </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      <SupplierModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setProveedorEditando(null);
        }}
        onSave={guardarProveedor}
        proveedor={proveedorEditando}
      />

    </>
  );
}