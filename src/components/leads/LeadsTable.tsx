"use client";

import { useModalStore } from "@/store/modalStore";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { proyectosDe } from "@/lib/proyectos";
import { formatFechaHora } from "@/lib/fecha";
import { slugDeNumero } from "@/lib/slug";
import FichaContacto from "./FichaContacto";
import type { Contacto } from "@/types";

// Valores reales de contactos.first_source_type (ver /stats/fuentes)
const ORIGEN_LABEL: Record<string, string> = {
  meta_ad: "Meta Ads",
  direct: "Directo",
};

function origenDe(c: Contacto): string {
  return (c.first_source_type && ORIGEN_LABEL[c.first_source_type]) || "Sin atribuir";
}

const TH = "px-4 py-3 font-semibold";
const SKELETON = "animate-pulse rounded bg-gray-200";

function SkeletonRows({ filas = 8 }: { filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 last:border-0">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`${SKELETON} h-9 w-9 rounded-full!`} />
              <div className={`${SKELETON} h-3 w-36`} />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className={`${SKELETON} h-3 w-24`} />
          </td>
          <td className="px-4 py-3">
            <div className={`${SKELETON} h-5 w-20 rounded-full!`} />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className={`${SKELETON} h-3 w-32`} />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className={`${SKELETON} h-3 w-20`} />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className={`${SKELETON} h-3 w-28`} />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className={`${SKELETON} h-3 w-28`} />
          </td>
          <td className="hidden px-4 py-3 sm:table-cell">
            <div className={`${SKELETON} ml-auto h-3 w-8`} />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function LeadsTable({
  leads,
  cargando = false,
}: {
  leads: Contacto[];
  cargando?: boolean;
}) {
  const showModal = useModalStore((s) => s.showModal);

  const abrirFicha = (c: Contacto) => {
    showModal(<FichaContacto numero={c.numero} />, {
      title: c.nombre || c.numero,
      widthClass: "max-w-md",
    });
  };

  return (
    <table className="w-full text-left text-sm">
      {/* sticky: el thead queda fijo mientras el contenedor scrollea */}
      <thead className="sticky top-0 z-10 bg-gray-50 text-[11px] tracking-wider text-gray-500 uppercase shadow-[inset_0_-1px_0_#e5e7eb]">
        <tr>
          <th className={TH}>Nombre</th>
          <th className={TH}>Número</th>
          <th className={TH}>Estado</th>
          <th className={`${TH} hidden lg:table-cell`}>Proyecto</th>
          <th className={`${TH} hidden lg:table-cell`}>Origen</th>
          <th className={`${TH} hidden lg:table-cell`}>Creado</th>
          <th className={`${TH} hidden lg:table-cell`}>Última actividad</th>
          <th className={`${TH} hidden text-right sm:table-cell`}>Msjs</th>
        </tr>
      </thead>
      <tbody>
        {cargando && <SkeletonRows />}
        {!cargando && leads.length === 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
              No hay leads con este filtro
            </td>
          </tr>
        )}
        {!cargando &&
          leads.map((c) => (
            <tr
              key={c.numero}
              className="border-b border-gray-100 transition-colors last:border-0 hover:bg-emerald-50/40"
            >
              {/* Solo el nombre abre la ficha: así el resto de la fila
                  (número, proyecto...) se puede seleccionar y copiar. */}
              <td className="px-4 py-2.5">
                <a
                  href={`/conversaciones?c=${slugDeNumero(c.numero)}`}
                  onClick={(e) => { e.preventDefault(); abrirFicha(c); }}
                  title="Ver ficha del lead"
                  className="group flex cursor-pointer items-center gap-3 text-left"
                >
                  <Avatar nombre={c.nombre} numero={c.numero} size="sm" />
                  <span className="font-medium text-gray-900 group-hover:text-[#00a884] group-hover:underline">
                    {c.nombre || "Sin nombre"}
                  </span>
                </a>
              </td>
              {/* select-all: un clic selecciona el número completo para copiar */}
              <td className="px-4 py-2.5 text-gray-500 tabular-nums select-all">
                {c.numero}
              </td>
              <td className="px-4 py-2.5">
                <Badge estado={c.estado} />
              </td>
              <td className="hidden px-4 py-2.5 text-gray-500 lg:table-cell">
                {proyectosDe(c).join(", ") || "—"}
              </td>
              <td className="hidden px-4 py-2.5 text-gray-500 lg:table-cell">
                {origenDe(c)}
              </td>
              {/* El filtro de fechas del panel filtra por esta columna */}
              <td className="hidden px-4 py-2.5 whitespace-nowrap text-gray-500 lg:table-cell">
                {formatFechaHora(c.creado_en)}
              </td>
              <td className="hidden px-4 py-2.5 whitespace-nowrap text-gray-500 lg:table-cell">
                {formatFechaHora(c.ultima_actividad)}
              </td>
              <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                <span className="inline-block min-w-7 rounded-full bg-gray-100 px-2 py-0.5 text-center text-xs font-medium text-gray-600">
                  {c.total_mensajes}
                </span>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
