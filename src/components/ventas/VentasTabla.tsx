"use client";

import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import { badgeCanal, badgeEstado } from "@/lib/canal-estilo";
import type { VentaAtribuida } from "@/types";

const monto = (v: number) =>
  v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Sperant manda las fechas como medianoche UTC ("2026-08-01T00:00:00.000Z")
 * para representar un día calendario, sin hora real. Formatearlas en la zona
 * de Perú (UTC-5) las corría cinco horas hacia atrás y una venta del 1 de
 * agosto se mostraba como 31 de julio. Se formatean en UTC para que el día
 * mostrado sea el que Sperant quiso decir.
 */
function fechaCorta(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function Badge({ canal }: { canal: string }) {
  return (
    <span
      className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold ${badgeCanal(canal)}`}
    >
      {canal}
    </span>
  );
}

function Contenido({ ventas }: { ventas: VentaAtribuida[] }) {
  return (
    <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
            <th className="pb-2 pr-2">Canal</th>
            <th className="pb-2 pr-2">Proyecto</th>
            <th className="pb-2 pr-2 text-right">Monto</th>
            <th className="pb-2 pr-2">Estado</th>
            <th className="pb-2">Fecha de venta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ventas.map((v) => (
            <tr key={v.codigo_proforma || `${v.documento}-${v.codigo_unidad}`} className="hover:bg-gray-50/50">
              <td className="py-2 pr-2">
                <div className="flex flex-col items-start gap-0.5">
                  <Badge canal={v.canal} />
                  {v.medio && (
                    <span className="max-w-[150px] truncate text-[11px] text-gray-500" title={v.medio}>
                      {v.medio}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2 pr-2 text-xs text-gray-800">
                {v.nombre_proyecto}
                <span className="block text-[11px] text-gray-400">{v.tipo_unidad}</span>
              </td>
              <td className="py-2 pr-2 text-right text-xs font-medium tabular-nums text-gray-900">
                {v.moneda} {monto(v.precio_lista)}
              </td>
              <td className="py-2 pr-2">
                <span
                  className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold ${badgeEstado(v.estado_contrato)}`}
                >
                  {v.estado_contrato || "—"}
                </span>
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
      subtitulo="Cada venta con el canal por el que entró el cliente, el proyecto y el monto"
    >
      {interior}
    </ChartCard>
  );
}
