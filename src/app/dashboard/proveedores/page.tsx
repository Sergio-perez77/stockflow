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

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar proveedor..."
        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 w-full md:w-80 mb-6"
      />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

        <table className="w-full">

          <thead className="border-b border-slate-700 text-gray-400">
            <tr>
              <th className="text-left pb-4">Empresa</th>
              <th className="text-left pb-4">Contacto</th>
              <th className="text-left pb-4">Email</th>
              <th className="text-left pb-4">Teléfono</th>
              <th className="text-left pb-4">Acciones</th>
            </tr>
          </thead>

          <tbody>

            {proveedoresFiltrados.map((proveedor) => (

              <tr
                key={proveedor.id}
                className="border-b border-slate-800"
              >

                <td className="py-4">{proveedor.empresa}</td>
                <td>{proveedor.contacto}</td>
                <td>{proveedor.email}</td>
                <td>{proveedor.telefono}</td>

                <td className="space-x-2">

                  <button
                    onClick={() => {
                      setProveedorEditando(proveedor);
                      setOpenModal(true);
                    }}
                    className="bg-cyan-500 px-3 py-1 rounded hover:bg-cyan-600"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "¿Eliminar este proveedor?"
                        )
                      ) {
                        eliminarProveedor(proveedor.id);
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