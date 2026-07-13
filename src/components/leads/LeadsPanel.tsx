"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useContactosPagina, PAGINA } from "@/hooks/useContactos";
import { useTodosContactos } from "@/hooks/useTodosContactos";
import { coincideEstado } from "@/lib/leads";
import { OTROS, PROYECTOS, SIN_PROYECTO, perteneceAProyecto } from "@/lib/proyectos";
import { useUIStore } from "@/store/uiStore";
import SearchSelect from "@/components/ui/SearchSelect";
import FilterChips from "./FilterChips";
import LeadsTable from "./LeadsTable";
import LeadsExport from "./LeadsExport";

const BTN_PAGINA =
  "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

const OPCIONES_PROYECTO = [
  { value: "todos", label: "Todos los proyectos" },
  ...PROYECTOS.map((p) => ({ value: p, label: p })),
  { value: OTROS, label: OTROS },
  { value: SIN_PROYECTO, label: SIN_PROYECTO },
];

export default function LeadsPanel() {
  const filtroLead = useUIStore((s) => s.filtroLead);
  const setTab = useUIStore((s) => s.setTab);
  const [pagina, setPagina] = useState(1);
  const [proyecto, setProyecto] = useState("todos");

  // proyecto_interes es texto libre que el backend no sabe normalizar, así
  // que ese filtro se resuelve en el cliente sobre la base completa.
  const porProyecto = proyecto !== "todos";

  // Al cambiar el filtro se vuelve a la primera página
  useEffect(() => setPagina(1), [filtroLead, proyecto]);

  // Paginación clásica de 50 (el filtro sigue yendo al servidor: ?estado=...)
  const { data, isLoading, isPlaceholderData } = useContactosPagina(
    pagina,
    filtroLead === "todos" ? undefined : filtroLead,
    !porProyecto
  );

  const { data: base = [], isLoading: cargandoBase } = useTodosContactos(porProyecto);

  const filtradosProyecto = useMemo(() => {
    if (!porProyecto) return [];
    return base
      .filter((c) => coincideEstado(c, filtroLead) && perteneceAProyecto(c, proyecto))
      .sort(
        (a, b) =>
          new Date(b.ultima_actividad || 0).getTime() -
          new Date(a.ultima_actividad || 0).getTime()
      );
  }, [base, porProyecto, filtroLead, proyecto]);

  const leads = porProyecto
    ? filtradosProyecto.slice((pagina - 1) * PAGINA, pagina * PAGINA)
    : (data?.leads ?? []);
  const hayMas = porProyecto
    ? pagina * PAGINA < filtradosProyecto.length
    : (data?.hayMas ?? false);
  const cargando = porProyecto ? cargandoBase : isLoading;

  // Al cambiar de página, la tabla vuelve arriba
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pagina]);

  const desde = (pagina - 1) * PAGINA + 1;
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
          <FilterChips />
          <SearchSelect
            className="w-56"
            valor={proyecto}
            onChange={setProyecto}
            opciones={OPCIONES_PROYECTO}
          />
          <LeadsExport />
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
            {leads.length > 0 ? `${desde}–${hasta}` : "0"}
            {porProyecto && ` de ${filtradosProyecto.length}`} · Página {pagina}
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
