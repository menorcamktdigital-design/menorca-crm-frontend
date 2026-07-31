import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Visita } from "@/types";

// Contactos con estado visita_agendada. fecha_visita es la fecha real
// acordada con el lead (viene de la tabla `visitas`); ultima_actividad
// solo se usa como respaldo para visitas antiguas que no la tienen, y en
// esos casos la fecha mostrada es la de la conversación, no la de la visita.
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
