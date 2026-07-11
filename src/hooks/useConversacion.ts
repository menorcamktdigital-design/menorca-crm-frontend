import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Mensaje } from "@/types";

const PAGE = 30;

export function useConversacion(numero: string | null) {
  return useInfiniteQuery<Mensaje[]>({
    queryKey: ["conversacion", numero],
    enabled: !!numero,
    queryFn: ({ pageParam }) =>
      api
        .get(`/api/crm/conversacion/${numero}`, { params: { offset: pageParam } })
        .then((r) => {
          const d = r.data;
          return Array.isArray(d)
            ? d
            : (Object.values(d).find(Array.isArray) as Mensaje[]) || [];
        }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
    refetchInterval: 5_000, // polling mensajes del chat activo
  });
}

// Las páginas llegan de más reciente a más antigua; dentro de cada página
// los mensajes vienen ASC. Para renderizar cronológicamente se invierte
// el orden de las páginas y se aplana.
export function flatMensajes(pages: Mensaje[][] = []): Mensaje[] {
  return [...pages].reverse().flat();
}
