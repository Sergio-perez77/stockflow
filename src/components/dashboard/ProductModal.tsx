interface ProductModalProps {
  open: boolean;
  onClose: () => void;

  onSave: (producto: {
    nombre: string;
    sku: string;
    categoria: string;
    costo: string;
    precio: string;
    stock: number;
    stockMinimo: number;
  }) => void;

  producto?: {
    id: number;
    codigo: string;
    sku: string;
    nombre: string;
    categoria: string;
    costo: string;
    precio: string;
    stock: number;
    stockMinimo: number;
  } | null;
}

import { useState } from "react";
import Modal from "@/components/ui/Modal";



export default function ProductModal({
  open,
  onClose,
  onSave,
  producto,
}: ProductModalProps) {

const [nombre, setNombre] = useState(() => producto?.nombre || "");
const [sku, setSku] = useState(() => producto?.sku ?? "");
const [categoria, setCategoria] = useState(() => producto?.categoria || "");
const [precio, setPrecio] = useState(() => producto?.precio || "");
const [costo, setCosto] = useState(() => producto?.costo ?? "");
const [stock, setStock] = useState(() => producto?.stock || 0);
const [stockMinimo, setStockMinimo] = useState(
  () => producto?.stockMinimo || 0
);

  return (
  <Modal
    key={`${open ? "open" : "closed"}-${producto?.id ?? "new"}`}
    open={open}
    title={producto ? "Editar producto" : "Nuevo producto"}
    onClose={onClose}
    onSave={() => {
      onSave({
        nombre,
        sku,
        categoria,
        costo,
        precio,
        stock: Number(stock),
        stockMinimo: Number(stockMinimo),
      });

      setNombre("");
      setCategoria("");
      setPrecio("");
      setStock(0);

      onClose();
    }}
    saveText={producto ? "Actualizar" : "Guardar"}
  >

        <div className="space-y-4">

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del producto"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoría"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            placeholder="Precio de costo"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Precio"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            placeholder="Stock"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          />

          <input
            type="number"
            value={stockMinimo}
            onChange={(e) =>
              setStockMinimo(Number(e.target.value))
            }
            placeholder="Stock mínimo"
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
              sku,
              categoria,
              costo,
              precio,
              stock: Number(stock),
              stockMinimo,
            });

            setNombre("");
            setCategoria("");
            setPrecio("");
            setStock(0);

            onClose();
          }}
          
          className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600">
            {producto ? "Actualizar" : "Guardar"}
          </button>

        </div>

      
    </Modal>
  );
}