import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Contacto, EstadoLead, RangoFechas } from "@/types";

const PAGE = 60;

function extraerFilas(d: unknown): Contacto[] {
  return Array.isArray(d)
    ? d
    : (Object.values(d as object).find(Array.isArray) as Contacto[]) || [];
}

// estado y búsqueda (?q=) se filtran en el servidor para que el scroll
// infinito pagine solo lo filtrado en vez de descargar toda la base.
export function useContactos(estado?: EstadoLead, q?: string) {
  return useInfiniteQuery<Contacto[]>({
    queryKey: ["contactos", estado ?? "todos", q ?? ""],
    queryFn: ({ pageParam }) =>
      api
        .get("/api/crm/contactos", {
          params: {
            limit: PAGE,
            offset: pageParam,
            ...(estado && { estado }),
            ...(q && { q }),
          },
        })
        .then((r) => extraerFilas(r.data)),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < PAGE) return undefined; // fin
      return (lastPageParam as number) + PAGE;
    },
    initialPageParam: 0,
    refetchInterval: 30_000, // refresco de la lista (no por página nueva)
  });
}

export const PAGINA = 50;

// Filtros de la tabla de leads. Los tres multi-select llegan como arrays
// (vacío = "todos"); se envían al backend como CSV (?estado=a,b). El
// backend pagina y filtra todo (incluido proyecto, por LIKE) y devuelve el
// total real para "1–50 de N".
export interface FiltrosLeads {
  estados: string[];
  proyectos: string[];
  origenes: string[];
  q?: string;
  rango?: RangoFechas;
}

const csv = (arr: string[]) => (arr.length > 0 ? arr.join(",") : undefined);

export function useContactosPagina(pagina: number, filtros: FiltrosLeads) {
  const { estados, proyectos, origenes, q, rango } = filtros;
  return useQuery({
    queryKey: [
      "contactos-pagina",
      estados.join(","),
      proyectos.join(","),
      origenes.join(","),
      q ?? "",
      rango?.desde ?? "",
      rango?.hasta ?? "",
      pagina,
    ],
    queryFn: () =>
      api
        .get("/api/crm/contactos", {
          params: {
            limit: PAGINA,
            offset: (pagina - 1) * PAGINA,
            ...(csv(estados) && { estado: csv(estados) }),
            ...(csv(proyectos) && { proyecto: csv(proyectos) }),
            ...(csv(origenes) && { origen: csv(origenes) }),
            ...(rango?.desde && { desde: rango.desde }),
            ...(rango?.hasta && { hasta: rango.hasta }),
            ...(q && { q }),
          },
        })
        .then((r) => ({
          leads: extraerFilas(r.data),
          total: (r.data?.total as number) ?? 0,
        })),
    placeholderData: keepPreviousData, // muestra la página anterior mientras carga
    refetchInterval: 30_000,
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
