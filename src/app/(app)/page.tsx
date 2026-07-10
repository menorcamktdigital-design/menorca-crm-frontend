"use client";

import { useMemo, useState } from "react";
import { useTodosContactos } from "@/hooks/useTodosContactos";
import StatTiles from "@/components/dashboard/StatTiles";
import EstadoDonut from "@/components/dashboard/EstadoDonut";
import PlazaBar from "@/components/dashboard/PlazaBar";
import ActividadChart from "@/components/dashboard/ActividadChart";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import ExportButton from "@/components/dashboard/ExportButton";

export default function DashboardPage() {
  const { data: contactos = [], isLoading, isError } = useTodosContactos();
  const [plaza, setPlaza] = useState("todas");

  const plazas = useMemo(
    () =>
      [...new Set(contactos.map((c) => c.proyecto_interes?.trim() || "Sin proyecto"))].sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    [contactos]
  );

  const filtrados = useMemo(
    () =>
      plaza === "todas"
        ? contactos
        : contactos.filter(
            (c) => (c.proyecto_interes?.trim() || "Sin proyecto") === plaza
          ),
    [contactos, plaza]
  );

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
            <PlazaFilter plazas={plazas} valor={plaza} onChange={setPlaza} />
            <ExportButton contactos={filtrados} plaza={plaza} />
          </div>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            No se pudo cargar la base de contactos. Reintentando automáticamente...
          </div>
        )}

        <StatTiles contactos={filtrados} cargando={isLoading} />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EstadoDonut contactos={filtrados} />
          <PlazaBar contactos={filtrados} />
        </div>

        <div className="mt-4">
          <ActividadChart contactos={filtrados} />
        </div>
      </div>
    </main>
  );
}
