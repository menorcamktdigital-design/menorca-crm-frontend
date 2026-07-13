import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Stats } from "@/types";

// proyecto: filtra los totales en el backend ("Sin proyecto" incluido)
export function useStats(proyecto?: string) {
  return useQuery<Stats>({
    queryKey: ["stats", proyecto ?? "todas"],
    // Los conteos llegan como string (COUNT de Postgres): se convierten acá
    // para que todo lo que consuma stats reciba números de verdad
    queryFn: () =>
      api
        .get("/api/crm/stats", { params: proyecto ? { proyecto } : undefined })
        .then((r) => ({
          total: Number(r.data.total) || 0,
          conversando: Number(r.data.conversando) || 0,
          derivados: Number(r.data.derivados) || 0,
          visitas: Number(r.data.visitas) || 0,
        })),
    refetchInterval: 30_000,
  });
}
