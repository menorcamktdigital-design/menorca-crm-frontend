"use client";

import {
  cpcReal,
  ctrReal,
  entero,
  mesCorto,
  porcentaje,
  soles,
  solesUnitario,
  type FunnelMes,
} from "@/lib/funnel";

export default function TablaMeses({
  meses,
  cargando,
  error,
}: {
  meses: FunnelMes[];
  cargando: boolean;
  error?: boolean;
}) {
  // Un mes sin inversión pero con sesiones es información válida (tráfico
  // orgánico), así que no se filtra nada: se muestran todos los meses del rango.
  const maxInversion = Math.max(...meses.map((m) => m.inversion), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h2 className="text-sm font-bold text-gray-900">Mes a mes</h2>
      </div>

      {error ? (
        <p className="px-5 pb-5 text-sm text-red-500">No se pudieron cargar los datos.</p>
      ) : cargando ? (
        <div className="space-y-1.5 px-5 pb-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : meses.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-400">
          Sin datos en el rango seleccionado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-y border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-2 text-left">Mes</th>
                <th className="px-3 py-2 text-right">Inversión</th>
                <th className="px-3 py-2 text-right">Impres.</th>
                <th className="px-3 py-2 text-right">Clics</th>
                <th className="px-3 py-2 text-right">CTR</th>
                <th className="px-3 py-2 text-right">CPC</th>
                <th className="px-3 py-2 text-right">Sesiones</th>
                <th className="px-3 py-2 text-right font-mono normal-case tracking-normal">form_start</th>
                <th className="px-3 py-2 text-right font-mono normal-case tracking-normal">form_send</th>
                <th className="px-3 py-2 text-right font-mono normal-case tracking-normal">send_whatsapp</th>
                <th className="px-3 py-2 text-right font-mono normal-case tracking-normal">maps_click</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {meses.map((m) => (
                <tr key={m.mes} className="hover:bg-gray-50/60">
                  <td className="relative px-5 py-2.5">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#00a884]/[0.07]"
                      style={{ width: `${(m.inversion / maxInversion) * 100}%` }}
                    />
                    <span className="relative font-medium text-gray-900">
                      {mesCorto(m.mes)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-gray-900">
                    {soles(m.inversion)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {entero(m.impresiones)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {entero(m.clics)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {porcentaje(ctrReal(m))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {solesUnitario(cpcReal(m))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-600">
                    {entero(m.sesiones)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {entero(m.form_start)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-amber-700">
                    {entero(m.form_send)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-amber-700">
                    {entero(m.whatsapp)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {entero(m.maps_click)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
