"use client";

import { ACCENT } from "@/components/dashboard/chartTheme";
import { useProyectosDeAnuncio } from "@/hooks/useStatsMarketing";
import type { RangoFechas } from "@/types";

// Desglose bajo demanda de /stats/anuncios/proyectos?ad_id=...: qué
// proyecto declararon los leads que llegaron por este anuncio. Se filtra
// por ad_id (identificador único real de Meta), no por nombre de texto,
// que puede repetirse entre dos anuncios distintos. Se monta solo al
// expandir, así el fetch ocurre recién ahí. `totalLeads` es el funnel real
// del anuncio (de /stats/anuncios o /stats/creativos): sirve para detectar
// cuándo la suma del desglose lo supera porque algún lead declaró más de
// un proyecto. `proyecto` es el filtro de plaza activo en la página (si
// hay uno): se propaga al desglose para que quede alineado con totalLeads,
// que ya viene filtrado por ese mismo proyecto.
export default function AnuncioProyectos({
  adId,
  rango,
  totalLeads,
  proyecto,
}: {
  adId: string;
  rango?: RangoFechas;
  totalLeads: number;
  proyecto?: string;
}) {
  const q = useProyectosDeAnuncio(adId, proyecto, rango);

  // Sin ad_id no hay forma de pedir el desglose (el endpoint filtra por
  // ese identificador): pasa con leads de atribución incompleta, no es
  // "sin proyectos declarados"
  if (!adId)
    return (
      <p className="py-2 text-xs text-gray-400">
        Este lead no tiene ad_id registrado — no se puede consultar su proyecto de interés por anuncio.
      </p>
    );

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
  const haySinProyecto = proyectos.some((p) => p.proyecto === "Sin proyecto");
  const soloProyectosReales = proyectos
    .filter((p) => p.proyecto !== "Sin proyecto")
    .reduce((acc, p) => acc + p.total, 0);
  // La suma puede superar el total por dos motivos distintos: un lead que
  // mencionó 2+ proyectos reales (normal, mismo criterio que "Leads por
  // plaza" en el dashboard), o un mismo contacto con dos filas en la BD
  // (una con proyecto_interes seteado y otra vacía). Como `proyecto` ya se
  // propaga al desglose, esto solo puede saltar por datos duplicados
  // reales, no por comparar un total filtrado contra una suma sin filtrar.
  // Se muestran por separado porque una es esperable y la otra no.
  const excesoPorMultiproyecto = Math.max(0, soloProyectosReales - totalLeads);
  const excesoPorDuplicado = sumaProyectos - totalLeads - excesoPorMultiproyecto;

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
                style={{
                  width: `${(p.total / max) * 100}%`,
                  backgroundColor: p.proyecto === "Sin proyecto" ? "#cfd8dc" : ACCENT,
                }}
              />
            </div>
            <span className="w-8 text-right font-semibold text-gray-900">
              {p.total.toLocaleString("es-PE")}
            </span>
          </li>
        ))}
      </ul>
      {/* "Sin proyecto" = llegó por este anuncio pero la conversación no
          avanzó lo suficiente para que el agente registrara qué proyecto
          quiere (se fue a mitad de chat, o preguntó algo genérico). El
          origen (este anuncio) sí se sabe siempre; el interés declarado es
          un dato aparte que depende de la conversación. */}
      {haySinProyecto && (
        <p className="pb-1 text-[11px] text-gray-400">
          &ldquo;Sin proyecto&rdquo; = escribió por este anuncio pero la conversación no llegó a confirmar qué proyecto le interesa.
        </p>
      )}
      {excesoPorMultiproyecto > 0 && (
        <p className="pb-1 text-[11px] text-gray-400">
          La suma de proyectos supera el total: algunos leads mencionaron más de un proyecto.
        </p>
      )}
      {excesoPorDuplicado > 0 && (
        <p className="pb-1 text-[11px] text-amber-600">
          ⚠️ {excesoPorDuplicado} lead{excesoPorDuplicado > 1 ? "s" : ""} aparece a la vez en
          &ldquo;Sin proyecto&rdquo; y en un proyecto real — dato inconsistente del backend, no un
          conteo real de dos proyectos distintos.
        </p>
      )}
    </>
  );
}
