"use client";

import { useMemo, useState } from "react";
import { useLeadsDeAnuncio } from "@/hooks/useStatsMarketing";
import { slugDeNumero } from "@/lib/slug";
import { formatFechaHora } from "@/lib/fecha";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import type { RangoFechas } from "@/types";

// Lista nominal de los leads de un anuncio (drill-down de CampanasFunnel).
// Se abre en modal al hacer clic en el ícono de leads de una fila de anuncio.
// Cada lead enlaza a su conversación (nueva pestaña) para ver en qué quedó.
export default function LeadsDeAnuncio({
  adId,
  proyecto,
  rango,
}: {
  adId: string;
  proyecto?: string;
  rango?: RangoFechas;
}) {
  const q = useLeadsDeAnuncio(adId, proyecto, rango);
  const [busca, setBusca] = useState("");

  const leads = useMemo(() => q.data ?? [], [q.data]);
  // Filtro en cliente por proyecto o nombre (ej. "villa punta mar"): sobre la
  // lista ya cargada, sin nueva llamada al backend
  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return leads;
    return leads.filter(
      (l) =>
        l.proyecto.toLowerCase().includes(t) || l.nombre.toLowerCase().includes(t)
    );
  }, [leads, busca]);

  if (q.isLoading)
    return <p className="py-6 text-center text-sm text-gray-400">Cargando leads...</p>;
  if (q.isError)
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No se pudieron cargar los leads de este anuncio.
      </p>
    );

  if (leads.length === 0)
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Sin leads para este anuncio con el filtro actual.
      </p>
    );

  return (
    <div className="flex max-h-[70vh] flex-col">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por proyecto o nombre..."
        className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]"
      />
      <p className="mb-2 text-xs text-gray-400">
        {filtrados.length.toLocaleString("es-PE")}
        {filtrados.length !== leads.length ? ` de ${leads.length.toLocaleString("es-PE")}` : ""} lead
        {leads.length > 1 ? "s" : ""} · clic para abrir la conversación
      </p>
      {filtrados.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Ningún lead coincide con &ldquo;{busca}&rdquo;.
        </p>
      ) : (
      <ul className="divide-y divide-gray-50 overflow-y-auto">
        {filtrados.map((l) => (
          <li key={l.numero}>
            <a
              href={`/conversaciones?c=${slugDeNumero(l.numero)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir la conversación de este lead"
              className="flex items-center gap-3 py-2 hover:bg-gray-50"
            >
              <Avatar nombre={l.nombre} numero={l.numero} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {l.nombre || "Sin nombre"}
                </p>
                <p className="truncate text-xs text-gray-400">
                  {l.proyecto}
                  {l.creadoEn ? ` · ${formatFechaHora(l.creadoEn)}` : ""}
                </p>
              </div>
              <Badge estado={l.estado} />
            </a>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
