"use client";

import type { VentasHistoricoData } from "@/types";

const n = (v: number) => v.toLocaleString("es-PE");

const CANAL_COLOR: Record<string, string> = {
  "Meta Ads": "bg-blue-100 text-blue-800",
  Web: "bg-purple-100 text-purple-800",
  WhatsApp: "bg-green-100 text-green-800",
  Referido: "bg-amber-100 text-amber-800",
  "Gestión directa": "bg-gray-100 text-gray-800",
  TikTok: "bg-red-100 text-red-800",
  Google: "bg-yellow-100 text-yellow-800",
  Otro: "bg-slate-100 text-slate-600",
  "Sin atribuir": "bg-slate-100 text-slate-500",
};

export default function VentasStatTiles({
  data,
  cargando,
}: {
  data?: VentasHistoricoData;
  cargando: boolean;
}) {
  if (cargando) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="mt-2 h-6 w-10 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const tiles = [
    { label: "Total ventas", value: n(data.total), className: "text-gray-900" },
    ...data.por_canal.slice(0, 3).map((c) => ({
      label: c.canal,
      value: n(c.total),
      className: CANAL_COLOR[c.canal] ?? CANAL_COLOR.Otro,
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{t.label}</p>
          <p className={`mt-1 text-2xl font-bold ${t.className}`}>{t.value}</p>
        </div>
      ))}
    </div>
  );
}
