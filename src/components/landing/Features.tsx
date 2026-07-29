export default function Features() {
  return (
    <section className="bg-slate-900 py-24 px-8">
      <h2 className="text-4xl font-bold text-center mb-16">
        Todo lo que tu negocio necesita
      </h2>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-8 hover:scale-105 transition">
          <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
            📦 Inventario
          </h3>
          <p className="text-gray-300">
            Controla el stock en tiempo real y evita pérdidas por falta de productos.
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 hover:scale-105 transition">
          <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
            💰 Ventas
          </h3>
          <p className="text-gray-300">
            Registra ventas y genera reportes automáticos con un solo clic.
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 hover:scale-105 transition">
          <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
            📊 Reportes
          </h3>
          <p className="text-gray-300">
            Analiza ingresos, productos más vendidos y rendimiento del negocio.
          </p>
        </div>
      </div>
    </section>
  );
}