"use client";

import { useMemo, useState } from "react";
import {
  useFormulariosTiktokCreativos,
  useFormulariosTiktokFunnel,
  useFormulariosTiktokStats,
  useFormulariosTiktokTotal,
  type FiltrosTiktok,
} from "@/hooks/useFormulariosTiktok";
import { useDebounce } from "@/hooks/useDebounce";
import { PROYECTOS } from "@/lib/proyectos";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import CanalTabs from "@/components/marketing/CanalTabs";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import FormulariosStatsTiles from "@/components/formularios/FormulariosStatsTiles";
import FormulariosTiktokExport from "@/components/formularios/FormulariosTiktokExport";
import CanalFunnel from "@/components/formularios/CanalFunnel";
import TiktokCreativos from "@/components/formularios/TiktokCreativos";
import type { RangoFechas } from "@/types";

// Vista de leads capturados por TikTok Lead Generation (formulario_tiktok).
// Mismo layout que Forms · Meta, pero el funnel es de 3 niveles: TikTok no
// manda UTMs ni conjunto — el webhook guarda campaign_name/ad_name/ad_id.
// El grid de creativos usa thumbnail_url/video_url resueltos vía la API de
// TikTok (backfill). Agrupa por ad_id.
export default function FormulariosTiktokPage() {
  const [plazas, setPlazas] = useState<string[]>([]);
  const [campana, setCampana] = useState("");
  const [rango, setRango] = useState<RangoFechas>({});

  const campanaDebounced = useDebounce(campana, 400);
  const proyecto = plazas.length > 0 ? plazas.join(",") : undefined;

  const filtros: FiltrosTiktok = useMemo(
    () => ({ proyecto, campana: campanaDebounced.trim() || undefined, rango }),
    [proyecto, campanaDebounced, rango]
  );

  const stats = useFormulariosTiktokStats(filtros);
  const funnel = useFormulariosTiktokFunnel(filtros);
  const creativos = useFormulariosTiktokCreativos(filtros);
  const { data: total = 0 } = useFormulariosTiktokTotal(filtros);

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <CanalTabs />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Formularios TikTok</h1>
            <p className="text-sm text-gray-500">
              Leads capturados por formularios instantáneos de TikTok
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={campana}
              onChange={(e) => setCampana(e.target.value)}
              placeholder="Buscar campaña..."
              className="w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#00a884]"
            />
            <PlazaFilter plazas={PROYECTOS} valores={plazas} onChange={setPlazas} />
            <DateRangeFilter valor={rango} onChange={setRango} />
            <FormulariosTiktokExport filtros={filtros} total={total} />
          </div>
        </div>

        <FormulariosStatsTiles stats={stats.data} cargando={stats.isLoading} />

        <div className="mt-4">
          <CanalFunnel
            filas={funnel.data ?? []}
            cargando={funnel.isLoading}
            error={funnel.isError}
            titulo="Funnel por campaña y anuncio"
            subtitulo="Qué campaña de TikTok trae leads y cuáles terminan derivados · expande para ver anuncios y proyectos de interés"
            encabezado="Campaña / anuncio / proyecto"
          />
        </div>

        <div className="mt-4">
          <TiktokCreativos
            creativos={creativos.data ?? []}
            cargando={creativos.isLoading}
            error={creativos.isError}
          />
        </div>
      </div>
    </main>
  );
}
