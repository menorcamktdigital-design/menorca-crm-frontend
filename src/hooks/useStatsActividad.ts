import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { StatsActividad } from "@/types";

// Actividad de los últimos 14 días, ya calculada en el backend
// (proyecto: filtra en el backend, "Sin proyecto" incluido)
export function useStatsActividad(proyecto?: string) {
  return useQuery<StatsActividad[]>({
    queryKey: ["stats-actividad", proyecto ?? "todas"],
    queryFn: () =>
      api
        .get("/api/crm/stats/actividad", {
          params: proyecto ? { proyecto } : undefined,
        })
        .then((r) => r.data),
    refetchInterval: 60_000,
  });
}
