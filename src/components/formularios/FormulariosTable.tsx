"use client";

import { formatFechaHora } from "@/lib/fecha";
import type { LeadFormulario } from "@/types";

const TH = "px-4 py-3 font-semibold";
const SKELETON = "animate-pulse rounded bg-gray-200";

function SkeletonRows({ filas = 8 }: { filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 last:border-0">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className={`${SKELETON} h-3 w-24`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function FormulariosTable({
  formularios,
  cargando = false,
}: {
  formularios: LeadFormulario[];
  cargando?: boolean;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="sticky top-0 z-10 bg-gray-50 text-[11px] tracking-wider text-gray-500 uppercase shadow-[inset_0_-1px_0_#e5e7eb]">
        <tr>
          <th className={TH}>Fecha</th>
          <th className={TH}>Nombre</th>
          <th className={TH}>Celular</th>
          <th className={TH}>Proyecto</th>
          <th className={TH}>Campaña</th>
          <th className={TH}>Anuncio</th>
          <th className={`${TH} text-right`}>Derivado</th>
        </tr>
      </thead>
      <tbody>
        {cargando && <SkeletonRows />}
        {!cargando && formularios.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
              No hay formularios con este filtro
            </td>
          </tr>
        )}
        {!cargando &&
          formularios.map((f) => (
            <tr
              key={f.id}
              className="border-b border-gray-100 transition-colors last:border-0 hover:bg-emerald-50/40"
            >
              <td className="px-4 py-2.5 whitespace-nowrap text-gray-500">
                {formatFechaHora(f.creado_en)}
              </td>
              <td className="px-4 py-2.5 font-medium text-gray-900">{f.nombre || "Sin nombre"}</td>
              <td className="px-4 py-2.5 text-gray-500 tabular-nums select-all">{f.numero}</td>
              <td className="px-4 py-2.5 text-gray-500">{f.proyecto_nombre || "—"}</td>
              <td className="px-4 py-2.5 text-gray-500">{f.utm_campaign || "—"}</td>
              <td className="px-4 py-2.5 text-gray-500">{f.utm_content || "—"}</td>
              <td className="px-4 py-2.5 text-right">
                {f.derivado ? (
                  <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Sí
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    No
                  </span>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
