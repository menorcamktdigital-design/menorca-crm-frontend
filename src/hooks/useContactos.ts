import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Contacto } from "@/types";

const PAGE = 60;

export function useContactos() {
  return useInfiniteQuery<Contacto[]>({
    queryKey: ["contactos"],
    queryFn: ({ pageParam }) =>
      api
        .get("/api/contactos", { params: { limit: PAGE, offset: pageParam } })
        .then((r) => {
          const d = r.data;
          return Array.isArray(d)
            ? d
            : (Object.values(d).find(Array.isArray) as Contacto[]) || [];
        }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE) return undefined; // fin
      return allPages.flat().length;
    },
    initialPageParam: 0,
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
