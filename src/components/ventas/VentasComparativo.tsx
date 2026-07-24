"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import ChartCard from "@/components/dashboard/ChartCard";
import type { VentasHistoricoData } from "@/types";
import { GRID, MUTED, ACCENT } from "@/components/dashboard/chartTheme";

const MESES_CORTO = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const CANAL_COLOR: Record<string, string> = {
  "Meta Ads": "#2a78d6",
  "Gestión directa": "#94a3b8",
  Referido: "#eda100",
  WhatsApp: "#00a884",
  Web: "#7c3aed",
  TikTok: "#ef4444",
  Google: "#eab308",
  Otro: "#cbd5e1",
  "Sin atribuir": "#e2e8f0",
};

interface Props {
  datos: VentasHistoricoData[];
  cargados: number;
  total: number;
  cargando: boolean;
  proyectoFiltro?: string;
}

function filtrarVentas(data: VentasHistoricoData, proyecto?: string) {
  if (!proyecto || proyecto === "todos") return data.ventas;
  return data.ventas.filter((v) => v.nombre_proyecto === proyecto);
}

export default function VentasComparativo({
  datos,
  cargados,
  total,
  cargando,
  proyectoFiltro,
}: Props) {
  const sorted = [...datos].sort((a, b) => a.mes - b.mes);

  const ventasPorMes = sorted.map((d) => {
    const ventas = filtrarVentas(d, proyectoFiltro);
    return {
      mes: MESES_CORTO[d.mes - 1],
      ventas: ventas.length,
    };
  });

  // Ranking de canales acumulado
  const canalCount: Record<string, number> = {};
  for (const d of sorted) {
    const ventas = filtrarVentas(d, proyectoFiltro);
    for (const v of ventas) {
      canalCount[v.canal] = (canalCount[v.canal] ?? 0) + 1;
    }
  }
  const rankingCanales = Object.entries(canalCount)
    .map(([canal, total]) => ({ canal, total }))
    .sort((a, b) => b.total - a.total);

  // Ranking de vendedores acumulado
  const vendedorCount: Record<string, number> = {};
  for (const d of sorted) {
    const ventas = filtrarVentas(d, proyectoFiltro);
    for (const v of ventas) {
      if (v.vendedor) {
        vendedorCount[v.vendedor] = (vendedorCount[v.vendedor] ?? 0) + 1;
      }
    }
  }
  const rankingVendedores = Object.entries(vendedorCount)
    .map(([vendedor, total]) => ({ vendedor, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const totalVentas = ventasPorMes.reduce((s, m) => s + m.ventas, 0);

  return (
    <div className="space-y-4">
      {/* Ventas por mes */}
      <ChartCard
        titulo="Ventas por mes"
        subtitulo={
          cargando
            ? `Cargando meses: ${cargados}/${total}`
            : `${totalVentas} ventas en ${cargados} meses${proyectoFiltro && proyectoFiltro !== "todos" ? ` · ${proyectoFiltro}` : ""}`
        }
      >
        {ventasPorMes.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">
            {cargando ? "Cargando datos…" : "Sin datos"}
          </div>
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorMes} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: MUTED }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: MUTED }}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${GRID}`,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value} ventas`, "Total"]}
                />
                <Bar dataKey="ventas" radius={[6, 6, 0, 0]} fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ranking canales */}
        <ChartCard titulo="Top canales" subtitulo="Acumulado de todos los meses">
          {rankingCanales.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              Sin datos
            </div>
          ) : (
            <div className="space-y-2">
              {rankingCanales.map((c, i) => {
                const pct = totalVentas > 0 ? (c.total / totalVentas) * 100 : 0;
                return (
                  <div key={c.canal} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-right text-xs font-bold text-gray-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{c.canal}</span>
                        <span className="text-xs tabular-nums text-gray-500">
                          {c.total} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CANAL_COLOR[c.canal] ?? "#94a3b8",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        {/* Ranking vendedores */}
        <ChartCard titulo="Top vendedores" subtitulo="Quién vende más (acumulado)">
          {rankingVendedores.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              Sin datos
            </div>
          ) : (
            <div className="max-h-75 space-y-2 overflow-y-auto">
              {rankingVendedores.map((v, i) => {
                const pct =
                  totalVentas > 0 ? (v.total / totalVentas) * 100 : 0;
                const maxVentas = rankingVendedores[0]?.total ?? 1;
                const barPct = (v.total / maxVentas) * 100;
                return (
                  <div key={v.vendedor} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-right text-xs font-bold text-gray-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-medium text-gray-800" title={v.vendedor}>
                          {v.vendedor}
                        </span>
                        <span className="ml-2 shrink-0 text-xs tabular-nums text-gray-500">
                          {v.total} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-[#00a884] transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
