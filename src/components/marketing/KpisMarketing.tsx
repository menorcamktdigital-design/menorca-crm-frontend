"use client";

import type { Fuente, GrupoTouch } from "@/lib/marketing";

const n = (v: number) => v.toLocaleString("es-PE");

// KPIs derivados de /stats/fuentes y /stats/multitouch: cuánto de la base
// tiene atribución, cuánto trae Meta Ads y qué tan bien convierte.
// "Sin atribuir" son leads previos al rastreo: se excluyen de "atribuidos".
export default function KpisMarketing({
  fuentes,
  multitouch,
  cargando,
}: {
  fuentes: Fuente[];
  multitouch: GrupoTouch[];
  cargando: boolean;
}) {
  const base = fuentes.reduce((acc, f) => acc + f.leads, 0);
  const atribuidas = fuentes.filter((f) => f.codigo !== "sin_atribuir");
  const atribuidos = atribuidas.reduce((acc, f) => acc + f.leads, 0);
  const meta = fuentes.find((f) => f.codigo.startsWith("meta"));

  const totalTouch = multitouch.reduce((acc, g) => acc + g.leads, 0);
  const unToque = multitouch.find((g) => g.esUnToque);
  const pctUnToque =
    totalTouch > 0 && unToque
      ? Math.round((unToque.leads / totalTouch) * 100)
      : null;

  const tiles = [
    {
      label: "Leads atribuidos",
      texto: n(atribuidos),
      sub: base > 0 ? `${Math.round((atribuidos / base) * 100)}% de la base` : "—",
      color: "text-gray-900",
    },
    {
      label: "Leads Meta Ads",
      texto: n(meta?.leads ?? 0),
      sub: `${n(meta?.derivados ?? 0)} derivados`,
      color: "text-[#2a78d6]",
    },
    {
      label: "Derivación Meta Ads",
      texto: meta && meta.ratio !== null ? `${meta.ratio}%` : "—",
      sub: "derivados / leads de Meta",
      color: "text-[#00a884]",
    },
    {
      label: "Escriben al 1er toque",
      texto: pctUnToque !== null ? `${pctUnToque}%` : "—",
      sub: unToque ? `${n(unToque.leads)} de ${n(totalTouch)} leads` : "—",
      color: "text-gray-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{t.label}</p>
          <p className={`mt-1 text-3xl font-bold ${t.color}`}>
            {cargando ? "—" : t.texto}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{cargando ? "" : t.sub}</p>
        </div>
      ))}
    </div>
  );
}
