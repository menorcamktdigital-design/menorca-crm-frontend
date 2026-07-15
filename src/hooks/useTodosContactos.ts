import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { FiltrosLeads } from "./useContactos";
import type { Contacto, RangoFechas } from "@/types";

const LOTE = 500;
const MAX = 20000;

const csv = (arr?: string[]) => (arr && arr.length > 0 ? arr.join(",") : undefined);

// Trae TODOS los contactos que coinciden con los filtros, paginando hasta
// el final. Se usa solo en el export (al hacer clic en "Descargar"), no en
// la vista de tabla —esa pagina en el servidor de 50 en 50—. Los mismos
// filtros que la tabla van al backend, así el CSV baja exactamente lo que
// el usuario está viendo filtrado, pero completo (todas las páginas).
async function fetchTodos(filtros: FiltrosLeads): Promise<Contacto[]> {
  const { estados, proyectos, origenes, q, rango } = filtros;
  const todos: Contacto[] = [];
  for (let offset = 0; offset < MAX; offset += LOTE) {
    const r = await api.get("/api/crm/contactos", {
      params: {
        limit: LOTE,
        offset,
        ...(csv(estados) && { estado: csv(estados) }),
        ...(csv(proyectos) && { proyecto: csv(proyectos) }),
        ...(csv(origenes) && { origen: csv(origenes) }),
        ...(rango?.desde && { desde: rango.desde }),
        ...(rango?.hasta && { hasta: rango.hasta }),
        ...(q && { q }),
      },
    });
    const d = r.data;
    const page: Contacto[] = Array.isArray(d)
      ? d
      : (Object.values(d).find(Array.isArray) as Contacto[]) || [];
    todos.push(...page);
    if (page.length < LOTE) break;
  }
  return todos;
}

const VACIO: FiltrosLeads = { estados: [], proyectos: [], origenes: [] };

export function useTodosContactos(filtros: FiltrosLeads = VACIO, enabled = false) {
  const { estados, proyectos, origenes, q, rango } = filtros;
  return useQuery<Contacto[]>({
    queryKey: [
      "contactos-todos",
      estados.join(","),
      proyectos.join(","),
      origenes.join(","),
      q ?? "",
      rango?.desde ?? "",
      rango?.hasta ?? "",
    ],
    queryFn: () => fetchTodos(filtros),
    staleTime: 55_000,
    enabled,
  });
}

// Compat: firma vieja (rango suelto) para llamadas que aún no migran
export function useTodosContactosPorRango(enabled = true, rango?: RangoFechas) {
  return useTodosContactos({ estados: [], proyectos: [], origenes: [], rango }, enabled);
}
