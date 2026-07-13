"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { OTROS } from "@/lib/proyectos";
import { ACCENT, MUTED } from "./chartTheme";
import ChartCard from "./ChartCard";

const TOP = 8;
const DIMMED = "#cfd8dc"; // barras fuera del filtro (contexto)

// El conteo por plaza viene de /stats/proyectos, que no acepta filtro:
// la gráfica siempre muestra la base completa. Con una plaza seleccionada,
// esa barra se garantiza en la lista (aunque esté fuera del top) y se
// resalta; el resto queda en gris como contexto.
export default function PlazaBar({
  conteos,
  seleccionada,
}: {
  conteos: Map<string, number>;
  seleccionada?: string;
}) {
  // "Otros" acumula: no reconocidos + todo lo que quede fuera del top
  const porPlaza = new Map(conteos);
  const otrosBase = porPlaza.get(OTROS) || 0;
  porPlaza.delete(OTROS);
  const ordenadas = [...porPlaza.entries()].sort((a, b) => b[1] - a[1]);

  let top = ordenadas.slice(0, TOP);
  let fuera = ordenadas.slice(TOP);
  if (seleccionada && !top.some(([p]) => p === seleccionada)) {
    const propia = fuera.find(([p]) => p === seleccionada) ?? [seleccionada, 0];
    fuera = fuera.filter(([p]) => p !== seleccionada);
    top = [...top, propia as [string, number]];
  }

  const resto = fuera.reduce((acc, [, n]) => acc + n, otrosBase);
  const datos = [
    ...top.map(([plaza, valor]) => ({ plaza, valor })),
    ...(resto > 0 ? [{ plaza: OTROS, valor: resto }] : []),
  ];

  const alto = Math.max(180, datos.length * 36);

  return (
    <ChartCard
      titulo="Leads por plaza"
      subtitulo={
        seleccionada
          ? `Toda la base · resaltando ${seleccionada}`
          : "Proyecto de interés declarado"
      }
    >
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ left: 0, right: 36 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="plaza"
              width={130}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: MUTED }}
            />
            <Tooltip
              formatter={(v) => [`${v} leads`, ""]}
              separator=""
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e9edef",
                fontSize: 12,
              }}
            />
            <Bar dataKey="valor" barSize={16} radius={[0, 4, 4, 0]}>
              {datos.map((d) => (
                <Cell
                  key={d.plaza}
                  fill={!seleccionada || d.plaza === seleccionada ? ACCENT : DIMMED}
                />
              ))}
              <LabelList
                dataKey="valor"
                position="right"
                style={{ fontSize: 12, fill: "#111b21", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
