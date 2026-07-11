import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Contacto, EstadoLead } from "@/types";

const PAGE = 60;

// estado se filtra en el servidor (?estado=...) para que el scroll
// infinito pagine solo lo filtrado en vez de descargar toda la base.
export function useContactos(estado?: EstadoLead) {
  return useInfiniteQuery<Contacto[]>({
    queryKey: ["contactos", estado ?? "todos"],
    queryFn: ({ pageParam }) =>
      api
        .get("/api/crm/contactos", {
          params: { limit: PAGE, offset: pageParam, ...(estado && { estado }) },
        })
        .then((r) => {
          const d = r.data;
          return Array.isArray(d)
            ? d
            : (Object.values(d).find(Array.isArray) as Contacto[]) || [];
        }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < PAGE) return undefined; // fin
      return (lastPageParam as number) + PAGE;
    },
    initialPageParam: 0,
    refetchInterval: 30_000, // refresco de la lista (no por página nueva)
  });
}

// Helper para aplanar las páginas y deduplicar por número
export function flatContactos(pages: Contacto[][] = []): Contacto[] {
  const map = new Map<string, Contacto>();
  for (const page of pages) for (const c of page) map.set(c.numero, c);
  return [...map.values()].sort(
    (a, b) =>
      new Date(b.ultima_actividad || 0).getTime() -
      new Date(a.ultima_actividad || 0).getTime()
  );
}
