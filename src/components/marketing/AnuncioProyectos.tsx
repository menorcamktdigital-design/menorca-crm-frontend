"use client";

import { ACCENT } from "@/components/dashboard/chartTheme";
import { useProyectosDeAnuncio } from "@/hooks/useStatsMarketing";
import type { RangoFechas } from "@/types";

// Desglose bajo demanda de /stats/anuncios/:anuncio/proyectos: qué
// proyecto declararon los leads que llegaron por este anuncio. Se monta
// solo al expandir, así el fetch ocurre recién ahí.
export default function AnuncioProyectos({
  anuncio,
  rango,
}: {
  anuncio: string;
  rango?: RangoFechas;
}) {
  const q = useProyectosDeAnuncio(anuncio, rango);

  if (q.isLoading)
    return <p className="py-2 text-xs text-gray-400">Cargando proyectos...</p>;
  if (q.isError)
    return (
      <p className="py-2 text-xs text-gray-400">
        No se pudieron cargar los proyectos de este anuncio.
      </p>
    );

  const proyectos = q.data ?? [];
  if (proyectos.length === 0)
    return (
      <p className="py-2 text-xs text-gray-400">
        Sin proyectos declarados para este anuncio.
      </p>
    );

  const max = Math.max(...proyectos.map((p) => p.total), 1);
  const sumaProyectos = proyectos.reduce((acc, p) => acc + p.total, 0);

  return (
    <>
      <ul className="space-y-1.5 py-1">
        {proyectos.map((p) => (
          <li key={p.proyecto} className="flex items-center gap-2 text-xs">
            <span className="w-40 shrink-0 truncate text-gray-600" title={p.proyecto}>
              {p.proyecto}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${(p.total / max) * 100}%`, backgroundColor: ACCENT }}
              />
            </div>
            <span className="w-8 text-right font-semibold text-gray-900">
              {p.total.toLocaleString("es-PE")}
            </span>
          </li>
        ))}
      </ul>
      {proyectos.length > 1 && sumaProyectos > max && (
        <p className="pb-1 text-[11px] text-gray-400">
          La suma supera el total de leads: algunos declararon más de un proyecto.
        </p>
      )}
    </>
  );
}
