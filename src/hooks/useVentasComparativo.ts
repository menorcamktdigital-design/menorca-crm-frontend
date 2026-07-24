import { useQueries } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { VentasHistoricoData } from "@/types";

export function useVentasComparativo(hastaMes: number) {
  const meses = Array.from({ length: hastaMes }, (_, i) => i + 1);

  const queries = useQueries({
    queries: meses.map((mes) => ({
      queryKey: ["ventas-historico", mes],
      queryFn: () =>
        api
          .get<VentasHistoricoData>("/api/ventas/historico", { params: { mes } })
          .then((r) => r.data),
      staleTime: 30 * 60_000,
      retry: 1,
    })),
  });

  const cargados = queries.filter((q) => q.isSuccess).length;
  const cargando = queries.some((q) => q.isLoading);
  const datos = queries
    .map((q) => q.data)
    .filter((d): d is VentasHistoricoData => !!d);

  return { datos, cargados, total: hastaMes, cargando };
}
