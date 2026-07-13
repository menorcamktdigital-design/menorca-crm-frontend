"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { ACCENT, GRID, MUTED } from "./chartTheme";
import { DIAS_ACTIVIDAD, type DiaActividad } from "./datos";
import ChartCard from "./ChartCard";

const COLOR_LEADS = "#667781"; // total del día (neutro)
const COLOR_DERIV = ACCENT; // subconjunto derivado (verde marca)

// Serie de los últimos 14 días: conversaciones con actividad ese día y
// cuántas quedaron derivadas (ver datos.ts para las dos fuentes posibles)
export default function ActividadChart({ dias }: { dias: DiaActividad[] }) {
  return (
    <ChartCard
      titulo="Conversaciones vs. derivados por día"
      subtitulo={`Conversaciones activas en el día y cuántas quedaron derivadas · últimos ${DIAS_ACTIVIDAD} días`}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dias} margin={{ top: 8, left: -18, right: 8 }}>
            <defs>
              <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_LEADS} stopOpacity={0.1} />
                <stop offset="100%" stopColor={COLOR_LEADS} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="derivFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_DERIV} stopOpacity={0.18} />
                <stop offset="100%" stopColor={COLOR_DERIV} stopOpacity={0} />
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
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            <Area
              type="monotone"
              name="Conversaciones"
              dataKey="leads"
              stroke={COLOR_LEADS}
              strokeWidth={2}
              fill="url(#leadsFill)"
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              name="Derivados"
              dataKey="derivados"
              stroke={COLOR_DERIV}
              strokeWidth={2}
              fill="url(#derivFill)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
