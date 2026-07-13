import type { ValoresTiles } from "./datos";

export default function StatTiles({
  valores,
  cargando,
}: {
  valores?: ValoresTiles;
  cargando: boolean;
}) {
  const tiles = [
    { label: "Leads", valor: valores?.leads ?? 0, color: "text-gray-900" },
    { label: "Conversando", valor: valores?.conversando ?? 0, color: "text-amber-600" },
    { label: "Derivados", valor: valores?.derivados ?? 0, color: "text-[#00a884]" },
    { label: "Visitas agendadas", valor: valores?.visitas ?? 0, color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{t.label}</p>
          <p className={`mt-1 text-3xl font-bold ${t.color}`}>
            {cargando ? "—" : t.valor.toLocaleString("es-PE")}
          </p>
        </div>
      ))}
    </div>
  );
}
