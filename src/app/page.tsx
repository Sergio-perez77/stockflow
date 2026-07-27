export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-5xl font-bold">
        StockFlow
      </h1>

      <p className="mt-6 max-w-xl text-center text-zinc-400 text-lg">
        Modern Inventory Management SaaS
      </p>

      <div className="mt-10 flex gap-4">

        <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition">
          Sign In
        </button>

        <button className="rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-900 transition">
          View Demo
        </button>

      </div>

    </main>
  );
}