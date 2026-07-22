"use client";

import { useMemo, useState } from "react";
import {
  useFormulariosWebFunnel,
  useFormulariosWebStats,
  useFormulariosWebTotal,
  type FiltrosWeb,
} from "@/hooks/useFormulariosWeb";
import { useDebounce } from "@/hooks/useDebounce";
import CanalTabs from "@/components/marketing/CanalTabs";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import FormulariosStatsTiles from "@/components/formularios/FormulariosStatsTiles";
import FormulariosWebExport from "@/components/formularios/FormulariosWebExport";
import CanalFunnel from "@/components/formularios/CanalFunnel";
import type { RangoFechas } from "@/types";

// Vista de leads del formulario de la web (formulario_web), atribuidos por
// UTMs: fuente (menorca_web, googleads, google) → medio (organic, cpc) →
// campaña (pmax, search...). Sin filtro de plaza: el form web no guarda
// proyecto_nombre de forma consistente.
export default function FormulariosWebPage() {
  const [fuente, setFuente] = useState("");
  const [campana, setCampana] = useState("");
  const [rango, setRango] = useState<RangoFechas>({});

  const fuenteDebounced = useDebounce(fuente, 400);
  const campanaDebounced = useDebounce(campana, 400);

  const filtros: FiltrosWeb = useMemo(
    () => ({
      fuente: fuenteDebounced.trim() || undefined,
      campana: campanaDebounced.trim() || undefined,
      rango,
    }),
    [fuenteDebounced, campanaDebounced, rango]
  );

  const stats = useFormulariosWebStats(filtros);
  const funnel = useFormulariosWebFunnel(filtros);
  const { data: total = 0 } = useFormulariosWebTotal(filtros);

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <CanalTabs />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Formularios Web</h1>
            <p className="text-sm text-gray-500">
              Leads del formulario de la web, atribuidos por UTM (orgánico, Google Ads...)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={fuente}
              onChange={(e) => setFuente(e.target.value)}
              placeholder="Buscar fuente..."
              className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#00a884]"
            />
            <input
              type="text"
              value={campana}
              onChange={(e) => setCampana(e.target.value)}
              placeholder="Buscar campaña..."
              className="w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#00a884]"
            />
            <DateRangeFilter valor={rango} onChange={setRango} />
            <FormulariosWebExport filtros={filtros} total={total} />
          </div>
        </div>

        <FormulariosStatsTiles
          stats={stats.data}
          cargando={stats.isLoading}
          etiquetaCuarto="Fuentes"
        />

        <div className="mt-4">
          <CanalFunnel
            filas={funnel.data ?? []}
            cargando={funnel.isLoading}
            error={funnel.isError}
            titulo="Funnel por fuente, medio y campaña"
            subtitulo="De dónde vienen los leads de la web y cuáles terminan derivados · expande para ver medio y campaña"
            encabezado="Fuente / medio / campaña"
          />
        </div>
      </div>
    </main>
  );
}
