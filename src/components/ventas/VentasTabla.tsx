"use client";

import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import type { VentaAtribuida } from "@/types";

const n = (v: number) =>
  v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CANAL_BADGE: Record<string, string> = {
  "Meta Ads": "bg-blue-100 text-blue-800",
  Web: "bg-purple-100 text-purple-800",
  WhatsApp: "bg-green-100 text-green-800",
  Referido: "bg-amber-100 text-amber-800",
  "Gestión directa": "bg-gray-100 text-gray-800",
  TikTok: "bg-red-100 text-red-800",
  Google: "bg-yellow-100 text-yellow-800",
  Otro: "bg-slate-100 text-slate-600",
  "Sin atribuir": "bg-slate-100 text-slate-500",
};

function fechaCorta(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

function Contenido({ ventas }: { ventas: VentaAtribuida[] }) {
  return (
    <div className="max-h-[500px] overflow-y-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
            <th className="pb-2 pr-2">Canal</th>
            <th className="pb-2 pr-2">Medio</th>
            <th className="pb-2 pr-2">Proyecto</th>
            <th className="pb-2 pr-2 text-right">USD</th>
            <th className="pb-2">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ventas.map((v, i) => (
            <tr key={`${v.documento}-${v.codigo_unidad}-${i}`} className="hover:bg-gray-50/50">
              <td className="py-2 pr-2">
                <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold ${CANAL_BADGE[v.canal] ?? CANAL_BADGE.Otro}`}>
                  {v.canal}
                </span>
              </td>
              <td className="max-w-[160px] truncate py-2 pr-2 text-xs text-gray-600" title={v.utm_campaign || v.medio}>
                {v.utm_campaign || v.medio}
              </td>
              <td className="py-2 pr-2 text-xs text-gray-800">{v.nombre_proyecto}</td>
              <td className="py-2 pr-2 text-right text-xs font-medium tabular-nums text-gray-900">
                ${n(v.precio_lista)}
              </td>
              <td className="py-2 text-xs text-gray-500">{fechaCorta(v.fecha_cierre)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function VentasTabla({
  ventas,
  cargando,
  error,
  sinCard,
}: {
  ventas: VentaAtribuida[];
  cargando: boolean;
  error: boolean;
  sinCard?: boolean;
}) {
  const interior = (
    <EstadoDatos cargando={cargando} error={error} vacio={ventas.length === 0}>
      <Contenido ventas={ventas} />
    </EstadoDatos>
  );

  if (sinCard) return interior;

  return (
    <ChartCard
      titulo="Detalle de ventas"
      subtitulo="Cada venta con su canal de atribución, proyecto y monto"
    >
      {interior}
    </ChartCard>
  );
}
