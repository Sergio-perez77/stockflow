interface StatCardProps {
  title: string;
  value: string;
  color: string;
}

export default function StatCard({
  title,
  value,
  color,
}: StatCardProps) {
  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-cyan-500 transition">
      <h3 className="text-gray-400 text-sm">
        {title}
      </h3>

      <p className={`text-3xl font-bold mt-3 ${color}`}>
        {value}
      </p>
    </div>
  );
}