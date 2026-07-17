"use client";

import type { FormulariosStats } from "@/types";

const n = (v: number) => v.toLocaleString("es-PE");

export default function FormulariosStatsTiles({
  stats,
  cargando,
}: {
  stats: FormulariosStats | undefined;
  cargando: boolean;
}) {
  const tiles = [
    {
      label: "Total leads formulario",
      texto: n(stats?.total ?? 0),
      color: "text-gray-900",
    },
    {
      label: "Derivados a Sperant",
      texto: n(stats?.derivados ?? 0),
      color: "text-[#00a884]",
    },
    {
      label: "% derivación",
      texto: stats?.ratioDerivacion != null ? `${stats.ratioDerivacion}%` : "—",
      color: "text-[#2a78d6]",
    },
    {
      label: "Campañas activas",
      texto: n(stats?.campanas ?? 0),
      color: "text-gray-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{t.label}</p>
          <p className={`mt-1 text-3xl font-bold ${t.color}`}>{cargando ? "—" : t.texto}</p>
        </div>
      ))}
    </div>
  );
}
