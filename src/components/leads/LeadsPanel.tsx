"use client";

import { useEffect, useRef } from "react";
import { useContactos, flatContactos } from "@/hooks/useContactos";
import { useUIStore } from "@/store/uiStore";
import FilterChips from "./FilterChips";
import LeadsTable from "./LeadsTable";

export default function LeadsPanel() {
  const filtroLead = useUIStore((s) => s.filtroLead);
  const setTab = useUIStore((s) => s.setTab);

  // El filtro va al servidor (?estado=...): así el scroll infinito
  // pagina solo lo filtrado en vez de descargar toda la base.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useContactos(
    filtroLead === "todos" ? undefined : filtroLead
  );

  const leads = flatContactos(data?.pages);

  // Scroll infinito sobre el panel (root = la sección, que es quien scrollea)
  const scrollRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <section
      ref={scrollRef}
      className="flex h-full flex-1 flex-col overflow-y-auto bg-gray-100 p-4 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Botón volver — solo móvil (el sidebar está oculto) */}
        <button
          onClick={() => setTab("chats")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 md:hidden"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Chats
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          Leads <span className="text-sm font-normal text-gray-500">({leads.length})</span>
        </h2>
        <FilterChips />
      </div>

      <LeadsTable leads={leads} />

      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <p className="py-3 text-center text-xs text-gray-400">Cargando más...</p>
      )}
    </section>
  );
}
