import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { paramsFiltro } from "@/hooks/useStats";
import type { RangoFechas, StatsProyecto } from "@/types";

// Conteo de leads por proyecto, ya agrupado en el backend
// (rango de fechas: filtra por creado_en en el backend)
export function useStatsProyectos(rango?: RangoFechas) {
  return useQuery<StatsProyecto[]>({
    queryKey: ["stats-proyectos", rango?.desde ?? "", rango?.hasta ?? ""],
    queryFn: () =>
      api
        .get("/api/crm/stats/proyectos", {
          params: paramsFiltro(undefined, rango),
        })
        .then((r) => r.data),
    refetchInterval: 60_000,
  });
}
