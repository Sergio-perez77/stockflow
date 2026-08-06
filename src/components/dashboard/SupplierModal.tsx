"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Proveedor } from "@/types/proveedor";

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (proveedor: Omit<Proveedor, "id">) => void;
  proveedor?: Proveedor | null;
}

export default function SupplierModal({
  open,
  onClose,
  onSave,
  proveedor,
}: SupplierModalProps) {
  const [empresa, setEmpresa] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    if (proveedor) {
      setEmpresa(proveedor.empresa);
      setContacto(proveedor.contacto);
      setEmail(proveedor.email);
      setTelefono(proveedor.telefono);
    } else {
      setEmpresa("");
      setContacto("");
      setEmail("");
      setTelefono("");
    }
  }, [proveedor, open]);

  return (
    <Modal
      open={open}
      title={proveedor ? "Editar proveedor" : "Nuevo proveedor"}
      onClose={onClose}
      onSave={() => {

      if (!empresa.trim()) {
        alert("Ingresá el nombre de la empresa.");
        return;
      }

      if (!contacto.trim()) {
        alert("Ingresá un contacto.");
        return;
      }

      if (!email.trim()) {
        alert("Ingresá un email.");
        return;
      }

      if (!telefono.trim()) {
        alert("Ingresá un teléfono.");
        return;
      }

      onSave({
        empresa: empresa.trim(),
        contacto: contacto.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
      });

      onClose();

    }}
      saveText={proveedor ? "Actualizar" : "Guardar"}
    >
      <div className="space-y-4">

        <input
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder="Empresa"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
        />

        <input
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          placeholder="Contacto"
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
    </Modal>
  );
}
