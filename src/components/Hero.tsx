export default function Hero() {
  return (
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
        <button className="bg-cyan-500 px-8 py-4 rounded-xl font-semibold hover:bg-cyan-600 transition">
          Comenzar gratis
        </button>

        <button className="border border-cyan-500 px-8 py-4 rounded-xl hover:bg-cyan-500 hover:text-black transition">
          Ver Demo
        </button>
      </div>
    </section>
  );
}