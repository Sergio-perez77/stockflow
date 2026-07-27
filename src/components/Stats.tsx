export default function Stats() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">

        <div className="bg-slate-800 rounded-xl p-6">
          <p className="text-gray-400">Productos</p>
          <h3 className="text-4xl font-bold text-cyan-400 mt-2">1,245</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <p className="text-gray-400">Ventas</p>
          <h3 className="text-4xl font-bold text-green-400 mt-2">$48,920</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <p className="text-gray-400">Clientes</p>
          <h3 className="text-4xl font-bold text-purple-400 mt-2">386</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <p className="text-gray-400">Pedidos</p>
          <h3 className="text-4xl font-bold text-orange-400 mt-2">129</h3>
        </div>

      </div>
    </section>
  );
}