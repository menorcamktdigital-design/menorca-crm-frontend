import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Visita } from "@/types";

// Contactos con estado visita_agendada. La fecha de la visita real solo
// existe si la BD tiene fecha_visita; si no, se usa ultima_actividad
// (momento en que el agente marcó la visita) como fecha de referencia.
export function useVisitas() {
  return useQuery<Visita[]>({
    queryKey: ["visitas"],
    queryFn: () => api.get("/api/crm/visitas").then((r) => r.data),
    refetchInterval: 60_000,
  });
}

// Fecha efectiva de la visita para agrupar en el calendario
export function fechaDeVisita(v: Visita): string | null {
  return v.fecha_visita || v.ultima_actividad || v.creado_en || null;
}
