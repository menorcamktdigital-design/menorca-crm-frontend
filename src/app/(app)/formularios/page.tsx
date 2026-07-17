"use client";

import { useMemo, useState } from "react";
import {
  useFormulariosFunnel,
  useFormulariosPagina,
  useFormulariosStats,
  PAGINA,
  type FiltrosFormularios,
} from "@/hooks/useFormularios";
import { useDebounce } from "@/hooks/useDebounce";
import { creativosDeFilas } from "@/lib/formulariosFunnel";
import { PROYECTOS } from "@/lib/proyectos";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import FormulariosStatsTiles from "@/components/formularios/FormulariosStatsTiles";
import FormulariosTable from "@/components/formularios/FormulariosTable";
import FormulariosExport from "@/components/formularios/FormulariosExport";
import FormulariosFunnel from "@/components/formularios/FormulariosFunnel";
import FormulariosCreativos from "@/components/formularios/FormulariosCreativos";
import type { RangoFechas } from "@/types";

const BTN_PAGINA =
  "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

// Vista de leads capturados por formularios de Meta (Instant Forms),
// separados de la conversación de WhatsApp. Los filtros van al backend
// (?proyecto=&utm_campaign=&desde=&hasta=), igual que en /marketing y Leads.
export default function FormulariosPage() {
  const [pagina, setPagina] = useState(1);
  const [plazas, setPlazas] = useState<string[]>([]);
  const [campana, setCampana] = useState("");
  const [rango, setRango] = useState<RangoFechas>({});

  const campanaDebounced = useDebounce(campana, 400);
  const proyecto = plazas.length > 0 ? plazas.join(",") : undefined;

  const filtros: FiltrosFormularios = useMemo(
    () => ({ proyecto, utmCampaign: campanaDebounced.trim() || undefined, rango }),
    [proyecto, campanaDebounced, rango]
  );

  const claveFiltros = `${proyecto ?? ""}|${filtros.utmCampaign ?? ""}|${rango.desde ?? ""}|${rango.hasta ?? ""}`;
  const [prevFiltros, setPrevFiltros] = useState(claveFiltros);
  if (prevFiltros !== claveFiltros) {
    setPrevFiltros(claveFiltros);
    setPagina(1);
  }

  const stats = useFormulariosStats(filtros);
  const funnel = useFormulariosFunnel(filtros);
  const creativos = useMemo(() => creativosDeFilas(funnel.data ?? []), [funnel.data]);
  const { data, isLoading: cargando, isPlaceholderData } = useFormulariosPagina(pagina, filtros);
  const formularios = data?.formularios ?? [];
  const total = data?.total ?? 0;
  const hayMas = pagina * PAGINA < total;

  const desde = total === 0 ? 0 : (pagina - 1) * PAGINA + 1;
  const hasta = (pagina - 1) * PAGINA + formularios.length;

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Formularios</h1>
            <p className="text-sm text-gray-500">
              Leads capturados por formularios de Meta (Instant Forms)
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

        <div className="mt-4 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={`overflow-auto transition-opacity ${isPlaceholderData ? "opacity-50" : ""}`}>
            <FormulariosTable formularios={formularios} cargando={cargando} />
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2.5">
            <span className="text-sm text-gray-500">
              {total > 0 ? `${desde}–${hasta} de ${total.toLocaleString("es-PE")}` : "0"} · Página {pagina}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina((p) => p - 1)}
                disabled={pagina === 1 || isPlaceholderData}
                className={BTN_PAGINA}
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => p + 1)}
                disabled={!hayMas || isPlaceholderData}
                className={BTN_PAGINA}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
