"use client";

import { useStats } from "@/hooks/useStats";

export default function StatsBar() {
  const { data } = useStats();

  const stats = [
    { valor: data?.total, label: "Leads" },
    { valor: data?.conversando, label: "Conversando" },
    { valor: data?.derivados, label: "Derivados" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 px-4 pb-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-gray-200 bg-white px-2 py-3 text-center"
        >
          <p className="text-xl font-bold text-gray-900">
            {s.valor ?? "—"}
          </p>
          <p className="text-xs text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
