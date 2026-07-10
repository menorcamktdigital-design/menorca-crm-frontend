"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { Contacto } from "@/types";
import { ACCENT, MUTED } from "./chartTheme";
import ChartCard from "./ChartCard";

const TOP = 8;

export default function PlazaBar({ contactos }: { contactos: Contacto[] }) {
  const porPlaza = new Map<string, number>();
  for (const c of contactos) {
    const plaza = c.proyecto_interes?.trim() || "Sin proyecto";
    porPlaza.set(plaza, (porPlaza.get(plaza) || 0) + 1);
  }

  const ordenadas = [...porPlaza.entries()].sort((a, b) => b[1] - a[1]);
  const top = ordenadas.slice(0, TOP);
  const resto = ordenadas.slice(TOP).reduce((acc, [, n]) => acc + n, 0);
  const datos = [
    ...top.map(([plaza, valor]) => ({ plaza, valor })),
    ...(resto > 0 ? [{ plaza: "Otros", valor: resto }] : []),
  ];

  const alto = Math.max(180, datos.length * 36);

  return (
    <ChartCard titulo="Leads por plaza" subtitulo="Proyecto de interés declarado">
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
            <Bar dataKey="valor" fill={ACCENT} barSize={16} radius={[0, 4, 4, 0]}>
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
