"use client";

import { useMemo, useState } from "react";
import {
  useFormulariosFunnel,
  useFormulariosPagina,
  useFormulariosStats,
  type FiltrosFormularios,
} from "@/hooks/useFormularios";
import { useDebounce } from "@/hooks/useDebounce";
import { creativosDeFilas } from "@/lib/formulariosFunnel";
import { PROYECTOS } from "@/lib/proyectos";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import CanalTabs from "@/components/marketing/CanalTabs";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import FormulariosStatsTiles from "@/components/formularios/FormulariosStatsTiles";
import FormulariosExport from "@/components/formularios/FormulariosExport";
import FormulariosFunnel from "@/components/formularios/FormulariosFunnel";
import FormulariosCreativos from "@/components/formularios/FormulariosCreativos";
import type { RangoFechas } from "@/types";

// Vista de leads capturados por formularios de Meta (Instant Forms),
// separados de la conversación de WhatsApp. Los filtros van al backend
// (?proyecto=&utm_campaign=&desde=&hasta=), igual que en /marketing y Leads.
export default function FormulariosPage() {
  const [plazas, setPlazas] = useState<string[]>([]);
  const [campana, setCampana] = useState("");
  const [rango, setRango] = useState<RangoFechas>({});

  const campanaDebounced = useDebounce(campana, 400);
  const proyecto = plazas.length > 0 ? plazas.join(",") : undefined;

  const filtros: FiltrosFormularios = useMemo(
    () => ({ proyecto, utmCampaign: campanaDebounced.trim() || undefined, rango }),
    [proyecto, campanaDebounced, rango]
  );

  const stats = useFormulariosStats(filtros);
  const funnel = useFormulariosFunnel(filtros);
  const creativos = useMemo(() => creativosDeFilas(funnel.data ?? []), [funnel.data]);
  // Solo se usa el total para el export; la tabla paginada ya no se muestra
  const { data } = useFormulariosPagina(1, filtros);
  const total = data?.total ?? 0;

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <CanalTabs />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Formularios</h1>
            <p className="text-sm text-gray-500">
              Leads capturados por formularios instantáneos de Meta
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
            <FormulariosExport filtros={filtros} total={total} />
          </div>
        </div>

        <FormulariosStatsTiles stats={stats.data} cargando={stats.isLoading} />

        <div className="mt-4">
          <FormulariosFunnel filas={funnel.data ?? []} cargando={funnel.isLoading} error={funnel.isError} />
        </div>

        <div className="mt-4">
          <FormulariosCreativos creativos={creativos} cargando={funnel.isLoading} error={funnel.isError} />
        </div>

      </div>
    </main>
  );
}
