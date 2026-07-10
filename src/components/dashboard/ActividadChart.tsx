"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { Contacto } from "@/types";
import { ACCENT, GRID, MUTED } from "./chartTheme";
import ChartCard from "./ChartCard";

const DIAS = 14;

export default function ActividadChart({ contactos }: { contactos: Contacto[] }) {
  // Serie de los últimos 14 días: cuántos leads tuvieron su última
  // actividad ese día (única señal temporal disponible en la API)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const dias: { fecha: Date; label: string; valor: number }[] = [];
  for (let i = DIAS - 1; i >= 0; i--) {
    const f = new Date(hoy);
    f.setDate(hoy.getDate() - i);
    dias.push({
      fecha: f,
      label: f.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
      valor: 0,
    });
  }

  for (const c of contactos) {
    if (!c.ultima_actividad) continue;
    const f = new Date(c.ultima_actividad);
    f.setHours(0, 0, 0, 0);
    const dia = dias.find((d) => d.fecha.getTime() === f.getTime());
    if (dia) dia.valor++;
  }

  return (
    <ChartCard
      titulo="Actividad por día"
      subtitulo={`Leads con última actividad en cada día · últimos ${DIAS} días`}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dias} margin={{ top: 8, left: -18, right: 8 }}>
            <defs>
              <linearGradient id="actividadFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.18} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: MUTED }}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: MUTED }}
            />
            <Tooltip
              formatter={(v) => [`${v} leads`, ""]}
              separator=""
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e9edef",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke={ACCENT}
              strokeWidth={2}
              fill="url(#actividadFill)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
