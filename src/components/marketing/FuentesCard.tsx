"use client";

import ChartCard from "@/components/dashboard/ChartCard";
import { MUTED } from "@/components/dashboard/chartTheme";
import type { Fuente } from "@/lib/marketing";
import EstadoDatos from "./EstadoDatos";

// Color fijo por identidad de fuente (nunca por posición) — pasos de la
// paleta validada del dashboard. Bajo contraste sobre blanco → los valores
// siempre van visibles al lado de cada barra. "Sin atribuir" (leads previos
// al rastreo) va en gris neutro: no es una fuente real.
const COLORES: Record<string, string> = {
  meta_ad: "#2a78d6",
  meta_ads: "#2a78d6",
  organic: "#00a884",
  organico: "#00a884",
  direct: "#4a3aa7",
  directo: "#4a3aa7",
};

const colorDe = (codigo: string) => COLORES[codigo.toLowerCase()] ?? MUTED;

// Barras por fuente de adquisición: total de leads (largo de barra),
// derivados y ratio como texto. HTML puro: pocas filas no necesitan recharts.
export default function FuentesCard({
  fuentes,
  cargando,
  error,
}: {
  fuentes: Fuente[];
  cargando: boolean;
  error: boolean;
}) {
  const totalLeads = fuentes.reduce((acc, f) => acc + f.leads, 0);
  const max = Math.max(...fuentes.map((f) => f.leads), 1);
  const haySinAtribuir = fuentes.some((f) => f.codigo === "sin_atribuir");

  return (
    <ChartCard
      titulo="Leads por fuente"
      subtitulo="De dónde llega el lead que escribe por WhatsApp"
    >
      <EstadoDatos cargando={cargando} error={error} vacio={fuentes.length === 0}>
        <ul className="space-y-4">
          {fuentes.map((f) => (
            <li key={f.codigo}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: colorDe(f.codigo) }}
                  />
                  {f.fuente}
                </span>
                <span>
                  <span className="font-semibold text-gray-900">
                    {f.leads.toLocaleString("es-PE")}
                  </span>
                  <span className="ml-1.5 text-xs text-gray-400">
                    {totalLeads ? Math.round((f.leads / totalLeads) * 100) : 0}%
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(f.leads / max) * 100}%`,
                    backgroundColor: colorDe(f.codigo),
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {f.derivados.toLocaleString("es-PE")} derivados
                {f.ratio !== null && ` · ${f.ratio}% derivación`}
                {f.conversando > 0 && ` · ${f.conversando.toLocaleString("es-PE")} conversando`}
              </p>
            </li>
          ))}
        </ul>

        {haySinAtribuir && (
          <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
            &ldquo;Sin atribuir&rdquo; = leads que escribieron antes de activar el
            rastreo de anuncios (o sin datos de origen). La atribución solo
            aplica a leads nuevos.
          </p>
        )}
      </EstadoDatos>
    </ChartCard>
  );
}
