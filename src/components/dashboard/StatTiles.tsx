import type { ValoresTiles } from "./datos";

export default function StatTiles({
  valores,
  cargando,
}: {
  valores?: ValoresTiles;
  cargando: boolean;
}) {
  const ratio =
    valores && valores.leads > 0
      ? ((valores.derivados / valores.leads) * 100).toLocaleString("es-PE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : "0.0";

  const tiles = [
    { label: "Leads", texto: (valores?.leads ?? 0).toLocaleString("es-PE"), color: "text-gray-900" },
    { label: "Conversando", texto: (valores?.conversando ?? 0).toLocaleString("es-PE"), color: "text-amber-600" },
    { label: "Derivados", texto: (valores?.derivados ?? 0).toLocaleString("es-PE"), color: "text-[#00a884]" },
    { label: "Recontactos", texto: (valores?.recontactos ?? 0).toLocaleString("es-PE"), color: "text-orange-600" },
    { label: "Ratio derivación", texto: `${ratio}%`, color: "text-[#00a884]" },
    { label: "Visitas agendadas", texto: (valores?.visitas ?? 0).toLocaleString("es-PE"), color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{t.label}</p>
          <p className={`mt-1 text-3xl font-bold ${t.color}`}>
            {cargando ? "—" : t.texto}
          </p>
        </div>
      ))}
    </div>
  );
}
