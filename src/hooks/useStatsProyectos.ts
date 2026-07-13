import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { StatsProyecto } from "@/types";

// Conteo de leads por proyecto, ya agrupado en el backend
export function useStatsProyectos() {
  return useQuery<StatsProyecto[]>({
    queryKey: ["stats-proyectos"],
    queryFn: () => api.get("/api/crm/stats/proyectos").then((r) => r.data),
    refetchInterval: 60_000,
  });
}
