import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Contacto, RangoFechas } from "@/types";

const LOTE = 200;
const MAX = 5000;

// Trae la base completa de contactos paginando hasta el final.
// Se usa en la vista de leads (filtros en cliente) y en los exports.
// rango de fechas (creado_en) se filtra en el servidor.
async function fetchTodos(rango?: RangoFechas): Promise<Contacto[]> {
  const todos: Contacto[] = [];
  for (let offset = 0; offset < MAX; offset += LOTE) {
    const r = await api.get("/api/crm/contactos", {
      params: {
        limit: LOTE,
        offset,
        ...(rango?.desde && { desde: rango.desde }),
        ...(rango?.hasta && { hasta: rango.hasta }),
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

export function useTodosContactos(enabled = true, rango?: RangoFechas) {
  return useQuery<Contacto[]>({
    queryKey: ["contactos-todos", rango?.desde ?? "", rango?.hasta ?? ""],
    queryFn: () => fetchTodos(rango),
    staleTime: 55_000,
    refetchInterval: 60_000, // el dashboard no necesita polling de 5s
    enabled,
  });
}
