export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-cyan-400">
          StockFlow
        </h1>

        <div className="flex gap-6">
          <a href="#" className="hover:text-cyan-400">Inicio</a>
          <a href="#" className="hover:text-cyan-400">Funciones</a>
          <a href="#" className="hover:text-cyan-400">Precios</a>
          <a href="#" className="hover:text-cyan-400">Contacto</a>
        </div>

        <button className="bg-cyan-500 px-5 py-2 rounded-lg hover:bg-cyan-600">
          Iniciar sesión
        </button>
      </nav>

      <section className="flex flex-col items-center justify-center text-center py-40 px-8">
        <h2 className="text-6xl font-bold mb-6">
          Gestiona tu inventario
          <span className="text-cyan-400"> sin complicaciones</span>
        </h2>

        <p className="text-xl text-gray-400 max-w-2xl">
          StockFlow es una plataforma moderna para controlar productos,
          ventas, clientes y reportes desde un solo lugar.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="bg-cyan-500 px-8 py-4 rounded-xl font-semibold hover:bg-cyan-600">
            Comenzar gratis
          </button>

          <button className="border border-cyan-500 px-8 py-4 rounded-xl hover:bg-cyan-500 hover:text-black">
            Ver Demo
          </button>
        </div>
      </section>

      <section className="bg-slate-900 py-24 px-8">
        <h2 className="text-4xl font-bold text-center mb-16">
          Todo lo que tu negocio necesita
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-8 hover:scale-105 transition">
            <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
              Inventario
            </h3>
            <p className="text-gray-300">
              Controla el stock en tiempo real y evita pérdidas por falta de productos.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-8 hover:scale-105 transition">
            <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
              Ventas
            </h3>
            <p className="text-gray-300">
              Registra ventas y genera reportes automáticos con un solo clic.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-8 hover:scale-105 transition">
            <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
              Reportes
            </h3>
            <p className="text-gray-300">
              Analiza ingresos, productos más vendidos y rendimiento del negocio.
            </p>
          </div>
        </div>

      </section>

    


    </main>
  );
}