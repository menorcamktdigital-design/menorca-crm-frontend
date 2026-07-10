"use client";

import { useEffect, useRef } from "react";
import { useContactos, flatContactos } from "@/hooks/useContactos";
import { useUIStore } from "@/store/uiStore";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import type { Contacto } from "@/types";

function formatHora(iso: string | null): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  if (esHoy) {
    return fecha.toLocaleTimeString("es-PE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
}

export default function ContactList() {
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading, isError } =
    useContactos();
  const busqueda = useUIStore((s) => s.busqueda);
  const numeroActivo = useUIStore((s) => s.numeroActivo);
  const setNumeroActivo = useUIStore((s) => s.setNumeroActivo);
  const setTab = useUIStore((s) => s.setTab);

  const contactos = flatContactos(data?.pages);

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? contactos.filter(
        (c) =>
          (c.nombre || "").toLowerCase().includes(q) || c.numero.includes(q)
      )
    : contactos;

  // Si la búsqueda no encuentra nada localmente, seguir cargando páginas
  useEffect(() => {
    if (q && filtrados.length === 0 && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [q, filtrados.length, hasNextPage, isFetching, fetchNextPage]);

  // Scroll infinito: cargar más al llegar al final
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);

  const abrirChat = (c: Contacto) => {
    setNumeroActivo(c.numero);
    setTab("chats");
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Cargando contactos...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-red-500">
        Error al cargar contactos. Reintentando...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filtrados.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-gray-400">
          {isFetching ? "Buscando..." : "Sin resultados"}
        </p>
      )}

      {filtrados.map((c) => (
        <button
          key={c.numero}
          onClick={() => abrirChat(c)}
          className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
            numeroActivo === c.numero ? "bg-gray-100" : ""
          }`}
        >
          <Avatar nombre={c.nombre} numero={c.numero} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-gray-900">
                {c.nombre || c.numero}
              </p>
              <span className="shrink-0 text-xs text-gray-400">
                {formatHora(c.ultima_actividad)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-gray-500">
                {c.ultimo_mensaje || ""}
              </p>
              <Badge estado={c.estado} />
            </div>
          </div>
        </button>
      ))}

      <div ref={sentinelRef} />
      {isFetching && filtrados.length > 0 && (
        <p className="py-3 text-center text-xs text-gray-400">Cargando más...</p>
      )}
    </div>
  );
}
