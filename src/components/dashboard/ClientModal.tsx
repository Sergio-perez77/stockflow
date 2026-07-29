"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (cliente: {
    nombre: string;
    dni: string;
    email: string;
    telefono: string;
  }) => void;
  cliente?: {
    id: number;
    codigo: string;
    nombre: string;
    dni: string;
    email: string;
    telefono: string;
  } | null;
}

export default function ClientModal({
  open,
  onClose,
  onSave,
  cliente,
}: ClientModalProps) {
  const [nombre, setNombre] = useState(cliente?.nombre || "");
  const [dni, setDni] = useState(cliente?.dni || "");
  const [email, setEmail] = useState(cliente?.email || "");
  const [telefono, setTelefono] = useState(cliente?.telefono || "");

  useEffect(() => {
  if (!open) return;

  if (cliente) {
    setNombre(cliente.nombre);
    setDni(cliente.dni);
    setEmail(cliente.email);
    setTelefono(cliente.telefono);
  } else {
    setNombre("");
    setDni("");
    setEmail("");
    setTelefono("");
  }
}, [cliente, open]);

  return (
  <Modal
    open={open}
    title={cliente ? "Editar cliente" : "Nuevo cliente"}
    onClose={onClose}
    onSave={() => {
      onSave({
        nombre,
        dni,
        email,
        telefono,
      });

      setNombre("");
      setEmail("");
      setTelefono("");

      onClose();
    }}
    saveText={cliente ? "Actualizar" : "Guardar"}
  >

        <div className="space-y-4">

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="DNI / CUIT"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
          >
            Cancelar
          </button>

          <button
            onClick={() => {
              onSave({
                nombre,
                dni,
                email,
                telefono,
              });

              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600"
          >
            {cliente ? "Actualizar" : "Guardar"}
          </button>

        </div>

      </Modal>
  );
}