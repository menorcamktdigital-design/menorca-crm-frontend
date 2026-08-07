"use client";

import { useState } from "react";
import {
  cpcReal,
  ctrReal,
  entero,
  porcentaje,
  soles,
  solesUnitario,
  type FunnelPlaza,
} from "@/lib/funnel";

type Columna = {
  key: keyof FunnelPlaza | "cpc" | "ctr" ;
  label: string;
  valor: (f: FunnelPlaza) => number;
  formato: (v: number) => string;
  ancho?: string;
};

const COLUMNAS: Columna[] = [
  { key: "inversion", label: "Inversión", valor: (f) => f.inversion, formato: soles },
  { key: "clics", label: "Clics", valor: (f) => f.clics, formato: entero },
  { key: "ctr", label: "CTR", valor: ctrReal, formato: porcentaje },
  { key: "cpc", label: "CPC", valor: cpcReal, formato: solesUnitario },
  { key: "sesiones", label: "Sesiones", valor: (f) => f.sesiones, formato: entero },
  // Los eventos van con su nombre de GA4 tal cual: lo que se ve acá es lo mismo
  // que se busca en Analytics, sin traducciones intermedias.
  { key: "form_start", label: "form_start", valor: (f) => f.form_start, formato: entero },
  { key: "form_send", label: "form_send", valor: (f) => f.form_send, formato: entero },
  { key: "whatsapp", label: "send_whatsapp", valor: (f) => f.whatsapp, formato: entero },
  { key: "maps_click", label: "maps_click", valor: (f) => f.maps_click, formato: entero },
];

export default function TablaPlazas({
  plazas,
  cargando,
  error,
}: {
  plazas: FunnelPlaza[];
  cargando: boolean;
  error?: boolean;
}) {
  const [orden, setOrden] = useState<Columna["key"]>("inversion");

  const col = COLUMNAS.find((c) => c.key === orden) ?? COLUMNAS[0];
  const filas = [...plazas].sort((a, b) => col.valor(b) - col.valor(a));

  // Las barras de fondo dan el peso relativo de cada plaza sin ocupar
  // una columna extra de gráfico.
  const maxOrden = filas.length > 0 ? col.valor(filas[0]) : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-baseline justify-between px-5 py-4">
        <h2 className="text-sm font-bold text-gray-900">Por plaza</h2>
        <p className="text-[11px] text-gray-400">Clic en una columna para ordenar</p>
      </div>

      {error ? (
        <p className="px-5 pb-5 text-sm text-red-500">No se pudieron cargar los datos.</p>
      ) : cargando ? (
        <div className="space-y-1.5 px-5 pb-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-400">
          Sin datos en el rango seleccionado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-y border-gray-100 bg-gray-50/60">
                <th className="px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Plaza
                </th>
                {COLUMNAS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-right">
                    <button
                      onClick={() => setOrden(c.key)}
                      className={`text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                        orden === c.key
                          ? "text-[#00a884]"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {c.label}
                      {orden === c.key && " ↓"}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filas.map((f) => (
                <tr key={f.plaza} className="relative hover:bg-gray-50/60">
                  <td className="relative px-5 py-2.5">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#00a884]/[0.07]"
                      style={{
                        width: maxOrden > 0 ? `${(col.valor(f) / maxOrden) * 100}%` : 0,
                      }}
                    />
                    <span
                      className={`relative font-medium ${
                        f.plaza === "Sin plaza" ? "text-amber-600" : "text-gray-900"
                      }`}
                    >
                      {f.plaza}
                    </span>
                  </td>
                  {COLUMNAS.map((c) => (
                    <td
                      key={c.key}
                      className="relative px-3 py-2.5 text-right tabular-nums text-gray-700"
                    >
                      {c.formato(c.valor(f))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
