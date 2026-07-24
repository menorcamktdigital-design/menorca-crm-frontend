"use client";

import { useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import type { ResumenCanal } from "@/types";

const n = (v: number) => v.toLocaleString("es-PE");

const CANAL_BADGE: Record<string, string> = {
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

function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${abierto ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function Contenido({ canales }: { canales: ResumenCanal[] }) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  const toggle = (canal: string) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(canal)) s.delete(canal);
      else s.add(canal);
      return s;
    });

  return (
    <>
      <div className="flex items-center border-b border-gray-100 pb-2 text-xs font-medium text-gray-500">
        <span className="flex-1">Canal / Campaña</span>
        <span className="w-16 text-right">Ventas</span>
      </div>

      <ul className="divide-y divide-gray-50">
        {canales.map((c) => (
          <li key={c.canal}>
            <button
              onClick={() => c.campanas.length > 0 && toggle(c.canal)}
              className="flex w-full items-center gap-2 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              {c.campanas.length > 0 ? (
                <Chevron abierto={abiertos.has(c.canal)} />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${CANAL_BADGE[c.canal] ?? CANAL_BADGE.Otro}`}>
                {c.canal}
              </span>
              <span className="min-w-0 flex-1" />
              <span className="w-16 text-right text-sm font-bold text-gray-900">
                {n(c.total)}
              </span>
            </button>

            {abiertos.has(c.canal) && (
              <ul className="max-h-[200px] overflow-y-auto border-l-2 border-gray-100 pb-1 pl-8">
                {c.campanas.map((camp) => (
                  <li
                    key={camp.nombre}
                    className="flex items-center gap-2 py-1.5 text-sm"
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-gray-600"
                      title={camp.nombre}
                    >
                      {camp.nombre}
                    </span>
                    <span className="w-16 text-right font-medium text-gray-700">
                      {n(camp.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function VentasPorCanal({
  canales,
  cargando,
  error,
  sinCard,
}: {
  canales: ResumenCanal[];
  cargando: boolean;
  error: boolean;
  sinCard?: boolean;
}) {
  const interior = (
    <EstadoDatos cargando={cargando} error={error} vacio={canales.length === 0}>
      <Contenido canales={canales} />
    </EstadoDatos>
  );

  if (sinCard) return interior;

  return (
    <ChartCard
      titulo="Ventas por canal y campaña"
      subtitulo="Atribución por primera interacción (first touch) — expande un canal para ver el detalle"
    >
      {interior}
    </ChartCard>
  );
}
