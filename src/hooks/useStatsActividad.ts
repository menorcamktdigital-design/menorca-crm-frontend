import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { paramsFiltro } from "@/hooks/useStats";
import type { RangoFechas, StatsActividad } from "@/types";

// Actividad diaria ya calculada en el backend. Sin fechas mantiene su
// default de últimos 14 días; con rango filtra por última actividad.
// (proyecto: filtra en el backend, "Sin proyecto" incluido)
export function useStatsActividad(proyecto?: string, rango?: RangoFechas) {
  return useQuery<StatsActividad[]>({
    queryKey: [
      "stats-actividad",
      proyecto ?? "todas",
      rango?.desde ?? "",
      rango?.hasta ?? "",
    ],
    queryFn: () =>
      api
        .get("/api/crm/stats/actividad", {
          params: paramsFiltro(proyecto, rango),
        })
        .then((r) => r.data),
    refetchInterval: 60_000,
  });
}
