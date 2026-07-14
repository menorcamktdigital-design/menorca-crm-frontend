import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Contacto, EstadoLead, RangoFechas } from "@/types";

const PAGE = 60;

function extraerFilas(d: unknown): Contacto[] {
  return Array.isArray(d)
    ? d
    : (Object.values(d as object).find(Array.isArray) as Contacto[]) || [];
}

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

// Página fija de 50 para la tabla de leads. Pide 51 filas: si llegan más
// de 50 hay página siguiente (la API no devuelve el total).
// estado y rango de fechas (creado_en) se filtran en el servidor.
export function useContactosPagina(
  pagina: number,
  estado?: EstadoLead,
  enabled = true,
  rango?: RangoFechas
) {
  return useQuery({
    enabled,
    queryKey: [
      "contactos-pagina",
      estado ?? "todos",
      rango?.desde ?? "",
      rango?.hasta ?? "",
      pagina,
    ],
    queryFn: () =>
      api
        .get("/api/crm/contactos", {
          params: {
            limit: PAGINA + 1,
            offset: (pagina - 1) * PAGINA,
            ...(estado && { estado }),
            ...(rango?.desde && { desde: rango.desde }),
            ...(rango?.hasta && { hasta: rango.hasta }),
          },
        })
        .then((r) => {
          const filas = extraerFilas(r.data);
          return { leads: filas.slice(0, PAGINA), hayMas: filas.length > PAGINA };
        }),
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
