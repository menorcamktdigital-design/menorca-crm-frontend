"use client";

import { useState } from "react";
import {
  contactos,
  costoPorContacto,
  entero,
  porcentaje,
  solesExacto,
  solesUnitario,
  type CampanaFunnel,
} from "@/lib/funnel";

const INICIAL = 15;

export default function CampanasTabla({
  campanas,
  cargando,
  error,
}: {
  campanas: CampanaFunnel[];
  cargando: boolean;
  error?: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const [orden, setOrden] = useState<"inversion" | "costo">("inversion");

  // Al ordenar por costo por contacto, las campañas sin ningún contacto van al
  // final: un costo de 0 las pondría primeras y parecerían las más eficientes
  // cuando en realidad no generaron nada.
  const ordenadas = [...campanas].sort((a, b) => {
    if (orden === "inversion") return b.inversion - a.inversion;
    const ca = contactos(a) > 0 ? costoPorContacto(a) : Infinity;
    const cb = contactos(b) > 0 ? costoPorContacto(b) : Infinity;
    return ca - cb;
  });

  const visibles = expandido ? ordenadas : ordenadas.slice(0, INICIAL);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-baseline justify-between px-5 py-4">
        <h2 className="text-sm font-bold text-gray-900">Campañas de Google Ads</h2>
        {campanas.length > 0 && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-400">{campanas.length} campañas · ordenar por</span>
            {(
              [
                ["inversion", "inversión"],
                ["costo", "costo x contacto"],
              ] as const
            ).map(([valor, texto]) => (
              <button
                key={valor}
                onClick={() => setOrden(valor)}
                className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                  orden === valor
                    ? "bg-[#00a884]/10 text-[#00a884]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <p className="px-5 pb-5 text-sm text-red-500">No se pudieron cargar los datos.</p>
      ) : cargando ? (
        <div className="space-y-1.5 px-5 pb-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : campanas.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-400">
          Sin campañas en el rango seleccionado.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-2 text-left">Campaña</th>
                  <th className="px-3 py-2 text-left">Plaza</th>
                  <th className="px-3 py-2 text-right">Inversión</th>
                  <th className="px-3 py-2 text-right">Impres.</th>
                  <th className="px-3 py-2 text-right">Clics</th>
                  <th className="px-3 py-2 text-right">CTR</th>
                  <th className="px-3 py-2 text-right">CPC</th>
                  <th className="px-3 py-2 text-right font-mono normal-case tracking-normal">form_send</th>
                  <th className="px-3 py-2 text-right font-mono normal-case tracking-normal">send_whatsapp</th>
                  <th className="px-3 py-2 text-right">Costo x contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibles.map((c) => (
                  <tr key={c.campaign_id} className="hover:bg-gray-50/60">
                    <td
                      className="max-w-[280px] truncate px-5 py-2.5 font-medium text-gray-900"
                      title={c.campaign_name}
                    >
                      {c.campaign_name}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          c.plaza === "Sin plaza"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.plaza}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums text-gray-900">
                      {solesExacto(c.inversion)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                      {entero(c.impresiones)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                      {entero(c.clics)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                      {porcentaje(c.ctr)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                      {solesUnitario(c.cpc)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                      {entero(c.form_send)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums text-amber-700">
                      {entero(c.whatsapp)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {contactos(c) === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className="font-bold text-gray-900">
                          {solesUnitario(costoPorContacto(c))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {campanas.length > INICIAL && (
            <button
              onClick={() => setExpandido((v) => !v)}
              className="w-full border-t border-gray-100 py-2.5 text-xs font-medium text-[#00a884] transition-colors hover:bg-gray-50"
            >
              {expandido
                ? "Ver menos"
                : `Ver las ${campanas.length - INICIAL} restantes`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
