"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useContactosPagina, PAGINA } from "@/hooks/useContactos";
import { useTodosContactos } from "@/hooks/useTodosContactos";
import { coincideBusqueda, coincideEstado } from "@/lib/leads";
import { OTROS, PROYECTOS, SIN_PROYECTO, perteneceAProyecto } from "@/lib/proyectos";
import { useUIStore } from "@/store/uiStore";
import SearchSelect from "@/components/ui/SearchSelect";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import type { RangoFechas } from "@/types";
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
  const [busqueda, setBusqueda] = useState("");
  const [rango, setRango] = useState<RangoFechas>({});

  // proyecto_interes es texto libre que el backend no sabe normalizar, y la
  // API tampoco expone búsqueda por número/nombre: ambos filtros se resuelven
  // en el cliente sobre la base completa. El rango de fechas sí va al
  // servidor (?desde=&hasta= sobre creado_en) en ambos caminos.
  const enCliente = proyecto !== "todos" || busqueda.trim() !== "";

  // Al cambiar cualquier filtro se vuelve a la primera página (ajuste de
  // estado durante el render, sin efecto: evita el render extra en cascada)
  const filtros = `${filtroLead}|${proyecto}|${busqueda}|${rango.desde ?? ""}|${rango.hasta ?? ""}`;
  const [prevFiltros, setPrevFiltros] = useState(filtros);
  if (prevFiltros !== filtros) {
    setPrevFiltros(filtros);
    setPagina(1);
  }

  // Paginación clásica de 50 (el filtro sigue yendo al servidor: ?estado=...)
  const { data, isLoading, isPlaceholderData } = useContactosPagina(
    pagina,
    filtroLead === "todos" ? undefined : filtroLead,
    !enCliente,
    rango
  );

  const { data: base = [], isLoading: cargandoBase } = useTodosContactos(
    enCliente,
    rango
  );

  const filtradosCliente = useMemo(() => {
    if (!enCliente) return [];
    return base
      .filter(
        (c) =>
          coincideEstado(c, filtroLead) &&
          (proyecto === "todos" || perteneceAProyecto(c, proyecto)) &&
          coincideBusqueda(c, busqueda)
      )
      .sort(
        (a, b) =>
          new Date(b.ultima_actividad || 0).getTime() -
          new Date(a.ultima_actividad || 0).getTime()
      );
  }, [base, enCliente, filtroLead, proyecto, busqueda]);

  const leads = enCliente
    ? filtradosCliente.slice((pagina - 1) * PAGINA, pagina * PAGINA)
    : (data?.leads ?? []);
  const hayMas = enCliente
    ? pagina * PAGINA < filtradosCliente.length
    : (data?.hayMas ?? false);
  const cargando = enCliente ? cargandoBase : isLoading;

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
          <SearchSelect
            className="w-56"
            valor={proyecto}
            onChange={setProyecto}
            opciones={OPCIONES_PROYECTO}
          />
          <DateRangeFilter valor={rango} onChange={setRango} />
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
            {enCliente && ` de ${filtradosCliente.length}`} · Página {pagina}
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
