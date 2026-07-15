"use client";

import { useMemo, useState } from "react";
import { useStats } from "@/hooks/useStats";
import { useStatsProyectos } from "@/hooks/useStatsProyectos";
import { useStatsActividad } from "@/hooks/useStatsActividad";
import { PROYECTOS, SIN_PROYECTO } from "@/lib/proyectos";
import {
  actividadDesdeStats,
  donutDesdeStats,
  plazasDesdeStats,
  tilesDesdeStats,
} from "@/components/dashboard/datos";
import StatTiles from "@/components/dashboard/StatTiles";
import EstadoDonut from "@/components/dashboard/EstadoDonut";
import PlazaBar from "@/components/dashboard/PlazaBar";
import ActividadChart from "@/components/dashboard/ActividadChart";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import ExportButton from "@/components/dashboard/ExportButton";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import type { RangoFechas } from "@/types";

// Sin "Otros": el filtro del backend matchea contra el texto del proyecto
// y no puede expresar "texto no reconocido"
const PLAZAS = [...PROYECTOS, SIN_PROYECTO];

export default function DashboardPage() {
  const [plazas, setPlazas] = useState<string[]>([]);
  const [rango, setRango] = useState<RangoFechas>({});
  // Con filtro activo, stats y actividad se filtran en el backend
  // (?proyecto=&desde=&hasta=, acepta varios separados por coma);
  // "Leads por plaza" no filtra por plaza (muestra todas) pero sí respeta
  // el rango de fechas
  const proyecto = plazas.length > 0 ? plazas.join(",") : undefined;
  // PlazaBar solo resalta una plaza a la vez: con 0 o 2+ seleccionadas se
  // ve la base completa sin resaltar ninguna
  const plazaResaltada = plazas.length === 1 ? plazas[0] : undefined;
  const rangoActivo = Boolean(rango.desde || rango.hasta);

  const stats = useStats(proyecto, rango);
  const statsProyectos = useStatsProyectos(rango);
  const statsActividad = useStatsActividad(proyecto, rango);

  const valores = stats.data && tilesDesdeStats(stats.data);
  const donut = stats.data ? donutDesdeStats(stats.data) : [];
  const totalDonut = stats.data?.total ?? 0;

  const conteosPlaza = useMemo(
    () => plazasDesdeStats(statsProyectos.data ?? []),
    [statsProyectos.data]
  );

  const dias = useMemo(
    () => actividadDesdeStats(statsActividad.data ?? [], rango),
    [statsActividad.data, rango]
  );

  const isError =
    stats.isError || statsProyectos.isError || statsActividad.isError;

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Resumen de leads del agente Menorca
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter valor={rango} onChange={setRango} />
            <PlazaFilter plazas={PLAZAS} valores={plazas} onChange={setPlazas} />
            <ExportButton plazas={plazas} rango={rango} />
          </div>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            No se pudieron cargar las estadísticas. Reintentando automáticamente...
          </div>
        )}

        <StatTiles valores={valores} cargando={stats.isLoading} />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EstadoDonut datos={donut} total={totalDonut} />
          <PlazaBar conteos={conteosPlaza} seleccionada={plazaResaltada} />
        </div>

        <div className="mt-4">
          <ActividadChart
            dias={dias}
            periodo={rangoActivo ? "rango seleccionado" : undefined}
          />
        </div>
      </div>
    </main>
  );
}
