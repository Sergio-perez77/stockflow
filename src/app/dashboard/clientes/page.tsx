"use client";

import { useState } from "react";
import ClientModal from "@/components/dashboard/ClientModal";
import { useLocalStorage } from "@/hooks/useLocalStorage";

import type { Cliente } from "@/types/cliente";

import { generarCodigo } from "@/lib/generadorCodigos";

export default function ClientesPage() {
  const {
  datos: clientes,
  setDatos: setClientes,
} = useLocalStorage<Cliente>("clientes");
  const [busqueda, setBusqueda] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);



  function guardarCliente(cliente: {
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
}) {

const existeDni = clientes.some(
  (c) =>
    c.dni === cliente.dni &&
    c.id !== clienteEditando?.id
);

if (existeDni) {
  alert("Ya existe un cliente con ese DNI/CUIT.");
  return;
}


  if (clienteEditando) {
    setClientes(
      clientes.map((c) =>
        c.id === clienteEditando.id
          ? { ...clienteEditando, ...cliente }
          : c
      )
    );
  } else {
    setClientes([
      ...clientes,
      {
        id: Date.now(),
        codigo: generarCodigo(
        "CLI",
        clientes.map((c) => c.codigo)
      ),
        ...cliente,
      },
    ]);
  }

  setClienteEditando(null);
  setOpenModal(false);
}

function eliminarCliente(id: number) {
  setClientes(clientes.filter((c) => c.id !== id));
}

  const clientesFiltrados = clientes.filter((cliente) => {
  const texto = busqueda.toLowerCase();

  return (
    cliente.nombre.toLowerCase().includes(texto) ||
    cliente.codigo.toLowerCase().includes(texto) ||
    cliente.dni.toLowerCase().includes(texto)
  );
});

  return (
   <>
  <div className="flex items-center justify-between mb-8">
    <h1 className="text-4xl font-bold text-white">
      Clientes
    </h1>

    <button
      onClick={() => setOpenModal(true)}
      className="bg-cyan-500 hover:bg-cyan-600 px-5 py-3 rounded-lg font-semibold"
    >
      + Nuevo cliente
    </button>
  </div>

  <input
    type="text"
    placeholder="Buscar cliente..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 w-full md:w-80 mb-6"
  />

  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
    <table className="w-full">
      <thead className="border-b border-slate-700 text-gray-400">
        <tr>
          <th className="text-left pb-4">Código</th>
          <th className="text-left pb-4">DNI/CUIT</th>
          <th className="text-left pb-4">Nombre</th>
          <th className="text-left pb-4">Email</th>
          <th className="text-left pb-4">Teléfono</th>
          <th className="text-left pb-4">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {clientesFiltrados.map((cliente) => (
          <tr
            key={cliente.id}
            className="border-b border-slate-800"
          >
            <td className="py-4 font-mono text-cyan-400">
              {cliente.codigo}
            </td>

            <td>{cliente.dni}</td>

            <td>{cliente.nombre}</td>

            <td>{cliente.email}</td>

            <td>{cliente.telefono}</td>

            <td className="space-x-2">
              <button
                onClick={() => {
                  setClienteEditando(cliente);
                  setOpenModal(true);
                }}
                className="bg-cyan-500 px-3 py-1 rounded hover:bg-cyan-600"
              >
                Editar
              </button>

              <button
                onClick={() => {
                  if (confirm("¿Eliminar este cliente?")) {
                    eliminarCliente(cliente.id);
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


  <ClientModal
  open={openModal}
  onClose={() => {
    setOpenModal(false);
    setClienteEditando(null);
  }}
  onSave={guardarCliente}
  cliente={clienteEditando}
/>
</>
  );
}