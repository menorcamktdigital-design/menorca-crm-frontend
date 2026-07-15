import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Contacto, RangoFechas } from "@/types";

const LOTE = 200;
const MAX = 5000;

// Trae la base completa de contactos paginando hasta el final.
// Se usa en la vista de leads (filtro por proyecto, resuelto en cliente) y
// en los exports. rango de fechas (creado_en) y búsqueda (?q=) se filtran
// en el servidor para no traer más de lo necesario.
async function fetchTodos(rango?: RangoFechas, q?: string): Promise<Contacto[]> {
  const todos: Contacto[] = [];
  for (let offset = 0; offset < MAX; offset += LOTE) {
    const r = await api.get("/api/crm/contactos", {
      params: {
        limit: LOTE,
        offset,
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

export function useTodosContactos(enabled = true, rango?: RangoFechas, q?: string) {
  return useQuery<Contacto[]>({
    queryKey: ["contactos-todos", rango?.desde ?? "", rango?.hasta ?? "", q ?? ""],
    queryFn: () => fetchTodos(rango, q),
    staleTime: 55_000,
    refetchInterval: 60_000, // el dashboard no necesita polling de 5s
    enabled,
  });
}
