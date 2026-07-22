import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { funnelDe, type FilaCanal } from "@/lib/canalFunnel";
import type { FormulariosStats, LeadFormularioTiktok, RangoFechas } from "@/types";

const LOTE = 500;
const MAX = 20000;

// Filtros de Forms · TikTok: proyecto (LIKE sobre proyecto_nombre),
// campaña por texto (campaign_name) y rango de fechas sobre creado_en.
export interface FiltrosTiktok {
  proyecto?: string;
  campana?: string;
  rango?: RangoFechas;
}

function paramsFiltro(filtros: FiltrosTiktok) {
  return {
    ...(filtros.proyecto && { proyecto: filtros.proyecto }),
    ...(filtros.campana && { campana: filtros.campana }),
    ...(filtros.rango?.desde && { desde: filtros.rango.desde }),
    ...(filtros.rango?.hasta && { hasta: filtros.rango.hasta }),
  };
}

const claveFiltros = (f: FiltrosTiktok) => [
  f.proyecto ?? "",
  f.campana ?? "",
  f.rango?.desde ?? "",
  f.rango?.hasta ?? "",
];

export function useFormulariosTiktokStats(filtros: FiltrosTiktok) {
  return useQuery<FormulariosStats>({
    queryKey: ["formularios-tiktok-stats", ...claveFiltros(filtros)],
    queryFn: () =>
      api
        .get("/api/crm/formularios/tiktok/stats", { params: paramsFiltro(filtros) })
        .then((r) => ({
          total: Number(r.data.total) || 0,
          derivados: Number(r.data.derivados) || 0,
          ratioDerivacion: r.data.ratio_derivacion != null ? Number(r.data.ratio_derivacion) : null,
          campanas: Number(r.data.campanas) || 0,
        })),
    refetchInterval: 30_000,
  });
}

export function useFormulariosTiktokTotal(filtros: FiltrosTiktok) {
  return useQuery({
    queryKey: ["formularios-tiktok-total", ...claveFiltros(filtros)],
    queryFn: () =>
      api
        .get("/api/crm/formularios/tiktok", { params: { limit: 1, ...paramsFiltro(filtros) } })
        .then((r) => (r.data?.total as number) ?? 0),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

// Trae TODOS los leads TikTok que coinciden con los filtros, paginando
// hasta el final. Solo para el export CSV.
async function fetchTodos(filtros: FiltrosTiktok): Promise<LeadFormularioTiktok[]> {
  const todos: LeadFormularioTiktok[] = [];
  for (let offset = 0; offset < MAX; offset += LOTE) {
    const r = await api.get("/api/crm/formularios/tiktok", {
      params: { limit: LOTE, offset, ...paramsFiltro(filtros) },
    });
    const page: LeadFormularioTiktok[] = r.data?.formularios ?? [];
    todos.push(...page);
    if (page.length < LOTE) break;
  }
  return todos;
}

export function useTodosFormulariosTiktok(filtros: FiltrosTiktok, enabled = false) {
  return useQuery<LeadFormularioTiktok[]>({
    queryKey: ["formularios-tiktok-todos", ...claveFiltros(filtros)],
    queryFn: () => fetchTodos(filtros),
    staleTime: 55_000,
    enabled,
  });
}

// Filas planas campaña → anuncio → proyecto (GET /formularios/tiktok/funnel),
// mapeadas a los 3 niveles genéricos de arbolCanal (lib/canalFunnel.ts)
export function useFormulariosTiktokFunnel(filtros: FiltrosTiktok) {
  return useQuery<FilaCanal[]>({
    queryKey: ["formularios-tiktok-funnel", ...claveFiltros(filtros)],
    queryFn: () =>
      api
        .get("/api/crm/formularios/tiktok/funnel", { params: paramsFiltro(filtros) })
        .then((r) =>
          (Array.isArray(r.data) ? r.data : []).map((f: Record<string, unknown>) => ({
            n1: (typeof f.campaign_name === "string" && f.campaign_name.trim()) || "(sin campaña)",
            n2: (typeof f.ad_name === "string" && f.ad_name.trim()) || "(sin anuncio)",
            // Ya viene resuelto a "Sin proyecto" desde el backend
            n3: (typeof f.proyecto_nombre === "string" && f.proyecto_nombre.trim()) || "Sin proyecto",
            funnel: funnelDe(Number(f.leads) || 0, Number(f.derivados) || 0),
          }))
        ),
    refetchInterval: 60_000,
  });
}
