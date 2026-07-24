"use client";

import { useState, useMemo } from "react";
import { useVentasHistorico } from "@/hooks/useVentasHistorico";
import { useVentasComparativo } from "@/hooks/useVentasComparativo";
import VentasStatTiles from "@/components/ventas/VentasStatTiles";
import VentasPorCanal from "@/components/ventas/VentasPorCanal";
import VentasTabla from "@/components/ventas/VentasTabla";
import VentasComparativo from "@/components/ventas/VentasComparativo";
import type { VentasHistoricoData, VentaAtribuida, ResumenCanal } from "@/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const mesActual = new Date().getMonth() + 1;

type Vista = "mes" | "evolucion";

function recalcularPorCanal(ventas: VentaAtribuida[]): ResumenCanal[] {
  const grupoCanal = new Map<string, VentaAtribuida[]>();
  for (const v of ventas) {
    const arr = grupoCanal.get(v.canal) ?? [];
    arr.push(v);
    grupoCanal.set(v.canal, arr);
  }
  return [...grupoCanal.entries()]
    .map(([canal, items]) => {
      const campMap = new Map<string, number>();
      for (const v of items) {
        const key = v.utm_campaign || v.medio;
        campMap.set(key, (campMap.get(key) ?? 0) + 1);
      }
      const campanas = [...campMap.entries()]
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);
      return { canal, total: items.length, campanas };
    })
    .sort((a, b) => b.total - a.total);
}

function ChevronIcon() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function VentasPage() {
  const [mes, setMes] = useState(mesActual);
  const [vista, setVista] = useState<Vista>("mes");
  const [proyecto, setProyecto] = useState("todos");
  const { data, isLoading, isError } = useVentasHistorico(mes);
  const comparativo = useVentasComparativo(mesActual);

  const proyectos = useMemo(() => {
    if (!data?.ventas) return [];
    return [...new Set(data.ventas.map((v) => v.nombre_proyecto))].sort();
  }, [data]);

  const proyectosEvolucion = useMemo(() => {
    return [
      ...new Set(
        comparativo.datos.flatMap((d) =>
          d.ventas.map((v) => v.nombre_proyecto)
        )
      ),
    ].sort();
  }, [comparativo.datos]);

  const filtrado = useMemo((): VentasHistoricoData | undefined => {
    if (!data) return undefined;
    if (proyecto === "todos") return data;
    const ventas = data.ventas.filter((v) => v.nombre_proyecto === proyecto);
    return {
      ...data,
      total: ventas.length,
      por_canal: recalcularPorCanal(ventas),
      ventas,
    };
  }, [data, proyecto]);

  const handleMes = (m: number) => {
    setMes(m);
    setProyecto("todos");
  };

  const tabClass = (activo: boolean) =>
    `rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
      activo
        ? "bg-[#00a884] text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  const listaProyectos = vista === "mes" ? proyectos : proyectosEvolucion;

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header + tabs */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ventas</h1>
            <p className="text-sm text-gray-500">
              Atribución de canal (first touch)
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button onClick={() => setVista("mes")} className={tabClass(vista === "mes")}>
              Por mes
            </button>
            <button onClick={() => setVista("evolucion")} className={tabClass(vista === "evolucion")}>
              Evolución
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {vista === "mes" && (
            <div className="relative">
              <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <select
                value={mes}
                onChange={(e) => handleMes(Number(e.target.value))}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-8 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#00a884]"
              >
                {MESES.map((nombre, i) => (
                  <option key={i + 1} value={i + 1}>{nombre}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          )}

          {listaProyectos.length > 1 && (
            <div className="relative">
              <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
              </svg>
              <select
                value={proyecto}
                onChange={(e) => setProyecto(e.target.value)}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-8 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#00a884]"
              >
                <option value="todos">Todos los proyectos</option>
                {listaProyectos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          )}
        </div>

        {/* Vista: Por mes */}
        {vista === "mes" && (
          <>
            <VentasStatTiles data={filtrado} cargando={isLoading} />

            <div className="mt-4">
              <VentasPorCanal
                canales={filtrado?.por_canal ?? []}
                cargando={isLoading}
                error={isError}
              />
            </div>

            <div className="mt-4">
              <VentasTabla
                ventas={filtrado?.ventas ?? []}
                cargando={isLoading}
                error={isError}
              />
            </div>
          </>
        )}

        {/* Vista: Evolución */}
        {vista === "evolucion" && (
          <VentasComparativo
            datos={comparativo.datos}
            cargados={comparativo.cargados}
            total={comparativo.total}
            cargando={comparativo.cargando}
            proyectoFiltro={proyecto}
          />
        )}
      </div>
    </main>
  );
}
