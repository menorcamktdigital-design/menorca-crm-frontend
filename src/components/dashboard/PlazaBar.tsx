"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { OTROS } from "@/lib/proyectos";
import type { ConteoPlaza } from "./datos";
import { MUTED } from "./chartTheme";
import ChartCard from "./ChartCard";

const TOP = 8;
const LEADS_COLOR = "#2a78d6";
const DERIVADOS_COLOR = "#00a884";
const DIMMED_LEADS = "#b8c9de";
const DIMMED_DERIVADOS = "#bcdfd5";

// El conteo por plaza viene de /stats/proyectos, que no acepta filtro:
// la gráfica siempre muestra la base completa. Con una plaza seleccionada,
// esa barra se garantiza en la lista (aunque esté fuera del top).
export default function PlazaBar({
  conteos,
  seleccionada,
}: {
  conteos: Map<string, ConteoPlaza>;
  seleccionada?: string;
}) {
  // "Otros" acumula: no reconocidos + todo lo que quede fuera del top
  const porPlaza = new Map(conteos);
  const otrosBase = porPlaza.get(OTROS) ?? { total: 0, derivados: 0 };
  porPlaza.delete(OTROS);
  const ordenadas = [...porPlaza.entries()].sort((a, b) => b[1].total - a[1].total);

  let top = ordenadas.slice(0, TOP);
  let fuera = ordenadas.slice(TOP);
  if (seleccionada && !top.some(([p]) => p === seleccionada)) {
    const propia = fuera.find(([p]) => p === seleccionada) ?? [
      seleccionada,
      { total: 0, derivados: 0 },
    ];
    fuera = fuera.filter(([p]) => p !== seleccionada);
    top = [...top, propia as [string, ConteoPlaza]];
  }

  const resto = fuera.reduce(
    (acc, [, c]) => ({ total: acc.total + c.total, derivados: acc.derivados + c.derivados }),
    otrosBase
  );
  const datos = [
    ...top.map(([plaza, c]) => ({ plaza, total: c.total, derivados: c.derivados })),
    ...(resto.total > 0 ? [{ plaza: OTROS, total: resto.total, derivados: resto.derivados }] : []),
  ];

  const alto = Math.max(180, datos.length * 44);

  return (
    <ChartCard
      titulo="Leads por plaza y derivados"
      subtitulo={
        seleccionada
          ? `Toda la base · resaltando ${seleccionada}`
          : "Proyecto de interés declarado"
      }
    >
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ left: 0, right: 36, top: 8 }}>
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
              separator=""
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e9edef",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: MUTED }}
            />
            <Bar dataKey="total" name="Leads" fill={LEADS_COLOR} barSize={12} radius={[0, 4, 4, 0]}>
              {datos.map((d) => (
                <Cell
                  key={d.plaza}
                  fill={!seleccionada || d.plaza === seleccionada ? LEADS_COLOR : DIMMED_LEADS}
                />
              ))}
              <LabelList
                dataKey="total"
                position="right"
                style={{ fontSize: 12, fill: LEADS_COLOR, fontWeight: 500 }}
              />
            </Bar>
            <Bar
              dataKey="derivados"
              name="Derivados"
              fill={DERIVADOS_COLOR}
              barSize={12}
              radius={[0, 4, 4, 0]}
            >
              {datos.map((d) => (
                <Cell
                  key={d.plaza}
                  fill={
                    !seleccionada || d.plaza === seleccionada ? DERIVADOS_COLOR : DIMMED_DERIVADOS
                  }
                />
              ))}
              <LabelList
                dataKey="derivados"
                position="right"
                style={{ fontSize: 12, fill: DERIVADOS_COLOR, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
