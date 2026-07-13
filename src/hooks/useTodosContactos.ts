import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Contacto } from "@/types";

const LOTE = 200;
const MAX = 5000;

// Trae la base completa de contactos paginando hasta el final.
// Se usa en el dashboard (gráficas y export) donde se necesita el total.
async function fetchTodos(): Promise<Contacto[]> {
  const todos: Contacto[] = [];
  for (let offset = 0; offset < MAX; offset += LOTE) {
    const r = await api.get("/api/crm/contactos", {
      params: { limit: LOTE, offset },
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

export function useTodosContactos(enabled = true) {
  return useQuery<Contacto[]>({
    queryKey: ["contactos-todos"],
    queryFn: fetchTodos,
    staleTime: 55_000,
    refetchInterval: 60_000, // el dashboard no necesita polling de 5s
    enabled,
  });
}
