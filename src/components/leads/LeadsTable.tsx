"use client";

import { useUIStore } from "@/store/uiStore";
import Badge from "@/components/ui/Badge";
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

export default function LeadsTable({ leads }: { leads: Contacto[] }) {
  const setNumeroActivo = useUIStore((s) => s.setNumeroActivo);
  const setTab = useUIStore((s) => s.setTab);

  const abrirChat = (numero: string) => {
    setNumeroActivo(numero);
    setTab("chats");
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Número</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Proyecto</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Última actividad</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Msjs</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                No hay leads con este filtro
              </td>
            </tr>
          )}
          {leads.map((c) => (
            <tr
              key={c.numero}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                <button
                  onClick={() => abrirChat(c.numero)}
                  className="font-medium text-gray-900 hover:text-[#00a884] hover:underline"
                >
                  {c.nombre || "Sin nombre"}
                </button>
              </td>
              <td className="px-4 py-3 text-gray-500">{c.numero}</td>
              <td className="px-4 py-3">
                <Badge estado={c.estado} />
              </td>
              <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                {c.proyecto_interes || "—"}
              </td>
              <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                {formatFecha(c.ultima_actividad)}
              </td>
              <td className="hidden px-4 py-3 text-right text-gray-500 sm:table-cell">
                {c.total_mensajes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
