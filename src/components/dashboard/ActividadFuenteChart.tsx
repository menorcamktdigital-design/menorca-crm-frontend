"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { GRID, MUTED } from "./chartTheme";
import { DIAS_ACTIVIDAD, type DiaActividad } from "./datos";
import ChartCard from "./ChartCard";

const COLOR_CONV = "#667781"; // conversaciones del día (neutro)
const COLOR_RATIO = "#eda100"; // % derivación (eje derecho, ámbar de la marca)

// Colores de identidad por fuente (mismos que "Leads por fuente")
const FUENTES = {
  meta: { color: "#2a78d6", etiqueta: "Meta Ads" },
  directo: { color: "#4a3aa7", etiqueta: "Orgánico / Directo" },
} as const;

type Fuente = keyof typeof FUENTES;

// Una gráfica por fuente: conversaciones del día de esa fuente, cuántas
// quedaron derivadas y el ratio de derivación (derivados/conversaciones)
// de ESA fuente. Permite comparar Meta vs orgánico lado a lado.
export default function ActividadFuenteChart({
  dias,
  fuente,
  periodo,
}: {
  dias: DiaActividad[];
  fuente: Fuente;
  periodo?: string;
}) {
  const { color, etiqueta } = FUENTES[fuente];
  const keyConv = fuente === "meta" ? "conversacionesMeta" : "conversacionesDirecto";
  const keyDeriv = fuente === "meta" ? "derivadosMeta" : "derivadosDirecto";
  const keyRatio = fuente === "meta" ? "ratioMeta" : "ratioDirecto";
  const fillId = `derivFill-${fuente}`;

  return (
    <ChartCard
      titulo={`WhatsApp ${etiqueta}`}
      subtitulo={`Conversaciones, derivados y ratio de derivación · ${periodo ?? `últimos ${DIAS_ACTIVIDAD} días`}`}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dias} margin={{ top: 8, left: -18, right: -14 }}>
            <defs>
              <linearGradient id="convFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_CONV} stopOpacity={0.1} />
                <stop offset="100%" stopColor={COLOR_CONV} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
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
              yAxisId="cantidad"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: MUTED }}
            />
            <YAxis
              yAxisId="ratio"
              orientation="right"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: COLOR_RATIO }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e9edef",
                fontSize: 12,
              }}
              formatter={(value, name) =>
                name === "Ratio derivación" ? [`${value}%`, name] : [value, name]
              }
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            <Area
              yAxisId="cantidad"
              type="monotone"
              name="Conversaciones"
              dataKey={keyConv}
              stroke={COLOR_CONV}
              strokeWidth={2}
              fill="url(#convFill)"
              activeDot={{ r: 4 }}
            />
            <Area
              yAxisId="cantidad"
              type="monotone"
              name="Derivados"
              dataKey={keyDeriv}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${fillId})`}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="ratio"
              type="monotone"
              name="Ratio derivación"
              dataKey={keyRatio}
              stroke={COLOR_RATIO}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
