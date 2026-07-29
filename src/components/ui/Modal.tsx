"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
  saveText?: string;
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  onSave,
  saveText = "Guardar",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-slate-900 rounded-xl p-8 w-full max-w-lg border border-slate-700">

        <h2 className="text-2xl font-bold text-white mb-6">
          {title}
        </h2>

        {children}

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600"
          >
            {saveText}
          </button>

        </div>

      </div>

    </div>
  );
}