"use client";

import Modal from "@/components/ui/Modal";
import type { Compra } from "@/types/compra";

interface Props {
  open: boolean;
  onClose: () => void;
  compra: Compra | null;
}

export default function CompraComprobanteModal({
  open,
  onClose,
  compra,
}: Props) {
  if (!compra) return null;

  return (
    <Modal
        open={open}
        onClose={onClose}
        onSave={() => {}}
        showSaveButton={false}
        title="Comprobante de compra"
    >
      <div className="space-y-3 text-white">

        <p>
          <strong>Código:</strong> {compra.codigo}
        </p>

        <p>
          <strong>Proveedor:</strong> {compra.proveedor}
        </p>

        <p>
          <strong>Producto:</strong> {compra.producto}
        </p>

        <p>
          <strong>Cantidad:</strong> {compra.cantidad}
        </p>

        <p>
          <strong>Costo:</strong> ${compra.costo}
        </p>

        <p>
          <strong>Fecha:</strong> {compra.fecha}
        </p>

        <p>
          <strong>Método de pago:</strong> {compra.metodoPago}
        </p>

        <p>
          <strong>Estado:</strong> {compra.estado}
        </p>

        <p>
          <strong>Observaciones:</strong>{" "}
          {compra.observaciones || "-"}
        </p>

      </div>
    </Modal>
  );
}