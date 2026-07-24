import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { VentasHistoricoData } from "@/types";

export function useVentasHistorico(mes: number) {
  const esPasado = mes < new Date().getMonth() + 1;

  return useQuery<VentasHistoricoData>({
    queryKey: ["ventas-historico", mes],
    queryFn: () =>
      api.get("/api/ventas/historico", { params: { mes } }).then((r) => r.data),
    staleTime: esPasado ? 30 * 60_000 : 5 * 60_000,
    retry: 1,
  });
}
