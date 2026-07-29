"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useLocalStorage } from "@/hooks/useLocalStorage";

import type { Producto } from "@/types/producto";
import type { Proveedor } from "@/types/proveedor";
import type { Compra } from "@/types/compra";

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (compra: Omit<Compra, "id">) => void;
}

export default function PurchaseModal({
  open,
  onClose,
  onSave,
}: PurchaseModalProps) {
  const { datos: productos } =
    useLocalStorage<Producto>("productos");

  const { datos: proveedores } =
    useLocalStorage<Proveedor>("proveedores");

  const [producto, setProducto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [costo, setCosto] = useState(0);
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    if (open) {
      setProducto("");
      setProveedor("");
      setCantidad(1);
      setCosto(0);
      setFecha(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="Nueva compra"
      onClose={onClose}
      onSave={() => {
        onSave({
          producto,
          proveedor,
          cantidad,
          costo,
          fecha,
        });

        onClose();
      }}
    >
      <div className="space-y-4">

        <select
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
        >
          <option value="">Seleccionar producto</option>

          {productos.map((p) => (
            <option key={p.id} value={p.nombre}>
              {p.nombre}
            </option>
          ))}
        </select>

        <select
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
        >
          <option value="">Seleccionar proveedor</option>

          {proveedores.map((p) => (
            <option key={p.id} value={p.empresa}>
              {p.empresa}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={cantidad}
          onChange={(e) =>
            setCantidad(Number(e.target.value))
          }
          placeholder="Cantidad"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
        />

        <input
          type="number"
          value={costo}
          onChange={(e) =>
            setCosto(Number(e.target.value))
          }
          placeholder="Costo"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
        />

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
        />

      </div>
    </Modal>
  );
}