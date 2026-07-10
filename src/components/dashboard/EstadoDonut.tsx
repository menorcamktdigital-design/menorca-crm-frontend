"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Contacto } from "@/types";
import { ESTADO_CHART, normalizarEstado } from "./chartTheme";
import ChartCard from "./ChartCard";

export default function EstadoDonut({ contactos }: { contactos: Contacto[] }) {
  const datos = ESTADO_CHART.map((e) => ({
    ...e,
    valor: contactos.filter((c) => normalizarEstado(c.estado) === e.key).length,
  })).filter((d) => d.valor > 0);

  const total = contactos.length;

  return (
    <ChartCard titulo="Leads por estado" subtitulo="Distribución actual de la base">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datos}
                dataKey="valor"
                nameKey="label"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {datos.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v} leads`, ""]}
                separator=""
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e9edef",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Número héroe al centro */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-gray-900">
              {total.toLocaleString("es-PE")}
            </p>
            <p className="text-xs text-gray-500">leads</p>
          </div>
        </div>

        {/* Leyenda con valores — obligatoria (colores de bajo contraste) */}
        <ul className="w-full space-y-2">
          {datos.map((d) => (
            <li key={d.key} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: d.color }}
              />
              <span className="flex-1 text-gray-600">{d.label}</span>
              <span className="font-semibold text-gray-900">{d.valor}</span>
              <span className="w-11 text-right text-xs text-gray-400">
                {total ? Math.round((d.valor / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
