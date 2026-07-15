import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { RangoFechas, Stats } from "@/types";

// Arma los query params comunes de filtro (solo los que tienen valor)
export function paramsFiltro(proyecto?: string, rango?: RangoFechas) {
  return {
    ...(proyecto && { proyecto }),
    ...(rango?.desde && { desde: rango.desde }),
    ...(rango?.hasta && { hasta: rango.hasta }),
  };
}

// proyecto y rango de fechas se filtran en el backend
// ("Sin proyecto" incluido; fechas sobre creado_en)
export function useStats(proyecto?: string, rango?: RangoFechas) {
  return useQuery<Stats>({
    queryKey: ["stats", proyecto ?? "todas", rango?.desde ?? "", rango?.hasta ?? ""],
    // Los conteos llegan como string (COUNT de Postgres): se convierten acá
    // para que todo lo que consuma stats reciba números de verdad
    queryFn: () =>
      api
        .get("/api/crm/stats", { params: paramsFiltro(proyecto, rango) })
        .then((r) => ({
          total: Number(r.data.total) || 0,
          conversando: Number(r.data.conversando) || 0,
          derivados: Number(r.data.derivados) || 0,
          visitas: Number(r.data.visitas) || 0,
          recontactos: Number(r.data.recontactos) || 0,
        })),
    refetchInterval: 30_000,
  });
}
