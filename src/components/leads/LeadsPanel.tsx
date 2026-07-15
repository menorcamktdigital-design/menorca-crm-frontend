"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useContactosPagina, PAGINA, type FiltrosLeads } from "@/hooks/useContactos";
import { useDebounce } from "@/hooks/useDebounce";
import { OTROS, PROYECTOS, SIN_PROYECTO } from "@/lib/proyectos";
import { useUIStore } from "@/store/uiStore";
import MultiSearchSelect from "@/components/ui/MultiSearchSelect";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import type { RangoFechas } from "@/types";
import LeadsTable from "./LeadsTable";
import LeadsExport from "./LeadsExport";

const BTN_PAGINA =
  "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

const OPCIONES_ESTADO = [
  { value: "en_conversacion", label: "Conversando" },
  { value: "recontacto", label: "Recontactos" },
  { value: "derivado", label: "Derivados" },
];

const OPCIONES_PROYECTO = [
  ...PROYECTOS.map((p) => ({ value: p, label: p })),
  { value: OTROS, label: OTROS },
  { value: SIN_PROYECTO, label: SIN_PROYECTO },
];

// Valores reales de contactos.first_source_type (ver /stats/fuentes):
// 'meta_ad' y 'direct' vienen de la columna; 'sin_atribuir' es el filtro
// para first_source_type NULL (lead sin atribución registrada).
const OPCIONES_ORIGEN = [
  { value: "meta_ad", label: "Meta Ads" },
  { value: "direct", label: "Directo" },
  { value: "sin_atribuir", label: "Sin atribuir" },
];

export default function LeadsPanel() {
  const setTab = useUIStore((s) => s.setTab);
  const [pagina, setPagina] = useState(1);
  // Arrays vacíos = "todos" (mismo criterio en los 3 filtros multi-select)
  const [estados, setEstados] = useState<string[]>([]);
  const [proyectos, setProyectos] = useState<string[]>([]);
  const [origenes, setOrigenes] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [rango, setRango] = useState<RangoFechas>({});

  const busquedaDebounced = useDebounce(busqueda, 400);
  const q = busquedaDebounced.trim();

  // Todos los filtros van al backend, que pagina de 50 en 50 y devuelve el
  // total real. Así entrar a la vista trae solo una página, no toda la base.
  const filtros: FiltrosLeads = useMemo(
    () => ({ estados, proyectos, origenes, q: q || undefined, rango }),
    [estados, proyectos, origenes, q, rango]
  );

  // Al cambiar cualquier filtro se vuelve a la primera página
  const claveFiltros = `${estados.join(",")}|${proyectos.join(",")}|${origenes.join(",")}|${q}|${rango.desde ?? ""}|${rango.hasta ?? ""}`;
  const [prevFiltros, setPrevFiltros] = useState(claveFiltros);
  if (prevFiltros !== claveFiltros) {
    setPrevFiltros(claveFiltros);
    setPagina(1);
  }

  const { data, isLoading: cargando, isPlaceholderData } = useContactosPagina(pagina, filtros);
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const hayMas = pagina * PAGINA < total;

  // Al cambiar de página, la tabla vuelve arriba
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pagina]);

  const desde = total === 0 ? 0 : (pagina - 1) * PAGINA + 1;
  const hasta = (pagina - 1) * PAGINA + leads.length;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-gray-100 p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setTab("chats")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Chats
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <MultiSearchSelect
            className="w-44"
            valores={estados}
            onChange={setEstados}
            opciones={OPCIONES_ESTADO}
            placeholder="Todos los estados"
          />
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <svg
              className="h-4 w-4 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Número o nombre..."
              className="w-40 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          <MultiSearchSelect
            className="w-48"
            valores={proyectos}
            onChange={setProyectos}
            opciones={OPCIONES_PROYECTO}
            placeholder="Todos los proyectos"
          />
          <MultiSearchSelect
            className="w-44"
            valores={origenes}
            onChange={setOrigenes}
            opciones={OPCIONES_ORIGEN}
            placeholder="Todos los orígenes"
          />
          <DateRangeFilter valor={rango} onChange={setRango} />
          <LeadsExport filtros={filtros} total={total} />
        </div>
      </div>

      {/* Card de la tabla: el scroll (vertical y horizontal) vive aquí dentro */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          ref={scrollRef}
          className={`flex-1 overflow-auto transition-opacity ${
            isPlaceholderData ? "opacity-50" : ""
          }`}
        >
          <LeadsTable leads={leads} cargando={cargando} />
        </div>

        {/* Paginación */}
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
    </section>
  );
}
