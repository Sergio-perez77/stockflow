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

  const [metodoPago, setMetodoPago] = useState("Efectivo");

  const [estado, setEstado] = useState<
    "Pagada" | "Pendiente"
  >("Pagada");

  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (open) {
      setProducto("");
      setProveedor("");
      setCantidad(1);
      setCosto(0);
      setFecha(new Date().toISOString().split("T")[0]);
      setMetodoPago("Efectivo");
      setEstado("Pagada");
      setObservaciones("");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="Nueva compra"
      onClose={onClose}
      onSave={() => {

      if (!producto) {
        alert("Seleccioná un producto.");
        return;
      }

      if (!proveedor) {
        alert("Seleccioná un proveedor.");
        return;
      }

      if (cantidad <= 0) {
        alert("La cantidad debe ser mayor que cero.");
        return;
      }

      if (costo <= 0) {
        alert("El costo debe ser mayor que cero.");
        return;
      }

      onSave({
        codigo: `COMP-${Date.now()}`,
        producto,
        proveedor,
        cantidad,
        costo,
        fecha,
        metodoPago,
        estado,
        observaciones,
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
            value={estado}
            onChange={(e) =>
              setEstado(e.target.value as "Pagada" | "Pendiente")
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          >
            <option value="Pagada">Pagada</option>
            <option value="Pendiente">Pendiente</option>
          </select>

          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones (opcional)"
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 resize-none"
          />

      </div>
    </Modal>
  );
}