export default function Navbar() {
  return (
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

      <button className="bg-cyan-500 px-5 py-2 rounded-lg hover:bg-cyan-600 transition">
        Iniciar sesión
      </button>
    </nav>
  );
}