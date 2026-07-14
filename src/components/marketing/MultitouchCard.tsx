"use client";

import ChartCard from "@/components/dashboard/ChartCard";
import { ACCENT } from "@/components/dashboard/chartTheme";
import type { GrupoTouch } from "@/lib/marketing";
import EstadoDatos from "./EstadoDatos";

const COLOR_UN = ACCENT; // escribió con el primer anuncio
const COLOR_MULTI = "#eda100"; // necesitó ver varios anuncios (ámbar)

const n = (v: number) => v.toLocaleString("es-PE");

// 1 toque vs 2+ toques antes del primer mensaje, comparando además cómo
// convierte cada grupo (ratio de derivación). Barra de proporción con
// separación entre segmentos y leyenda con valores visibles (los colores
// quedan bajo 3:1 sobre blanco).
export default function MultitouchCard({
  grupos,
  cargando,
  error,
}: {
  grupos: GrupoTouch[];
  cargando: boolean;
  error: boolean;
}) {
  const total = grupos.reduce((acc, g) => acc + g.leads, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const colorDe = (g: GrupoTouch) => (g.esUnToque ? COLOR_UN : COLOR_MULTI);

  return (
    <ChartCard
      titulo="Toques antes de escribir"
      subtitulo="Cuántos anuncios distintos vio el lead antes del primer mensaje"
    >
      <EstadoDatos cargando={cargando} error={error} vacio={total === 0}>
        {/* Barra de proporción (gap de 2px entre segmentos) */}
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          {grupos
            .filter((g) => g.leads > 0)
            .map((g) => (
              <div
                key={g.grupo}
                style={{ width: `${(g.leads / total) * 100}%`, backgroundColor: colorDe(g) }}
              />
            ))}
        </div>

        <ul className="mt-4 space-y-4">
          {grupos.map((g) => (
            <li key={g.grupo}>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: colorDe(g) }}
                />
                <span className="flex-1 text-gray-600">
                  {g.grupo}
                  <span className="ml-1 hidden text-xs text-gray-400 sm:inline">
                    · {g.esUnToque ? "escribió con el primer anuncio" : "vio varios anuncios antes"}
                  </span>
                </span>
                <span className="font-semibold text-gray-900">{n(g.leads)}</span>
                <span className="w-11 text-right text-xs text-gray-400">
                  {pct(g.leads)}%
                </span>
              </div>
              <p className="ml-5 mt-0.5 text-xs text-gray-500">
                {n(g.derivados)} derivados
                {g.ratio !== null && ` · ${g.ratio}% derivación`}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
          {n(total)} leads con atribución de anuncios
        </p>
      </EstadoDatos>
    </ChartCard>
  );
}
