"use client";

import Link from "next/link";
import BusinessSettings from "@/components/dashboard/BusinessSettings";

export default function ConfiguracionPage() {

  return (

    <>
      <h1 className="text-4xl font-bold text-white mb-2">
        Configuración
      </h1>

      <p className="text-gray-400 mb-8">
        Personalizá StockFlow según las necesidades de tu negocio.
      </p>

      <BusinessSettings />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-2">
            🏪 Negocio
          </h2>

          <p className="text-gray-400">
            Datos de la empresa y comprobantes.
          </p>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-2">
            👤 Usuario
          </h2>

          <p className="text-gray-400">
            Perfil y preferencias personales.
          </p>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-2">
            🎨 Apariencia
          </h2>

          <p className="text-gray-400">
            Tema y personalización visual.
          </p>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-2">
            💰 Regional
          </h2>

          <p className="text-gray-400">
            Moneda, idioma y formato de fechas.
          </p>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-2">
            🔒 Seguridad
          </h2>

          <p className="text-gray-400">
            Contraseña y acceso.
          </p>

        </div>

        <Link
          href="/dashboard/configuracion/datos"
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500 transition block"
        >
          <h2 className="text-xl font-semibold mb-2">
            💾 Datos
          </h2>

          <p className="text-gray-400">
            Importar y exportar información.
          </p>
        </Link>

      </div>

    </>

  );

}