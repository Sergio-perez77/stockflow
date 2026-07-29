export default function Topbar() {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-gray-300 hover:text-cyan-400 transition">
          🔔
        </button>

        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-slate-900">
          SP
        </div>
      </div>
    </header>
  );
}