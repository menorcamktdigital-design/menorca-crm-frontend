"use client";

import { useUIStore } from "@/store/uiStore";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { proyectosDe } from "@/lib/proyectos";
import type { Contacto } from "@/types";

function formatFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
  const setNumeroActivo = useUIStore((s) => s.setNumeroActivo);
  const setTab = useUIStore((s) => s.setTab);

  const abrirChat = (numero: string) => {
    setNumeroActivo(numero);
    setTab("chats");
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
          <th className={`${TH} hidden lg:table-cell`}>Última actividad</th>
          <th className={`${TH} hidden text-right sm:table-cell`}>Msjs</th>
        </tr>
      </thead>
      <tbody>
        {cargando && <SkeletonRows />}
        {!cargando && leads.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
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
              {/* Solo el nombre abre el chat: así el resto de la fila
                  (número, proyecto...) se puede seleccionar y copiar.
                  Es un <a> real para que el clic derecho / Ctrl+clic permita
                  "abrir en otra pestaña"; el clic normal se intercepta y abre
                  el chat en esta misma pestaña sin recargar. */}
              <td className="px-4 py-2.5">
                <a
                  href={`/conversaciones?chat=${encodeURIComponent(c.numero)}`}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                    e.preventDefault();
                    abrirChat(c.numero);
                  }}
                  title="Abrir conversación"
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
              <td className="hidden px-4 py-2.5 whitespace-nowrap text-gray-500 lg:table-cell">
                {formatFecha(c.ultima_actividad)}
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
