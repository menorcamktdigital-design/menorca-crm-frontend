import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { funnelDe, type FilaCanal } from "@/lib/canalFunnel";
import type { FormulariosStats, LeadFormularioWeb, RangoFechas } from "@/types";

const LOTE = 500;
const MAX = 20000;

// Filtros de Forms · Web: fuente (LIKE sobre utm_source), campaña por
// texto (utm_campaign) y rango de fechas sobre creado_en.
export interface FiltrosWeb {
  fuente?: string;
  campana?: string;
  rango?: RangoFechas;
}

function paramsFiltro(filtros: FiltrosWeb) {
  return {
    ...(filtros.fuente && { fuente: filtros.fuente }),
    ...(filtros.campana && { campana: filtros.campana }),
    ...(filtros.rango?.desde && { desde: filtros.rango.desde }),
    ...(filtros.rango?.hasta && { hasta: filtros.rango.hasta }),
  };
}

const claveFiltros = (f: FiltrosWeb) => [
  f.fuente ?? "",
  f.campana ?? "",
  f.rango?.desde ?? "",
  f.rango?.hasta ?? "",
];

// El 4to tile acá cuenta fuentes distintas (utm_source), no campañas: se
// mapea igual al campo `campanas` de FormulariosStats para reusar los tiles
export function useFormulariosWebStats(filtros: FiltrosWeb) {
  return useQuery<FormulariosStats>({
    queryKey: ["formularios-web-stats", ...claveFiltros(filtros)],
    queryFn: () =>
      api
        .get("/api/crm/formularios/web/stats", { params: paramsFiltro(filtros) })
        .then((r) => ({
          total: Number(r.data.total) || 0,
          derivados: Number(r.data.derivados) || 0,
          ratioDerivacion: r.data.ratio_derivacion != null ? Number(r.data.ratio_derivacion) : null,
          campanas: Number(r.data.fuentes) || 0,
        })),
    refetchInterval: 30_000,
  });
}

export function useFormulariosWebTotal(filtros: FiltrosWeb) {
  return useQuery({
    queryKey: ["formularios-web-total", ...claveFiltros(filtros)],
    queryFn: () =>
      api
        .get("/api/crm/formularios/web", { params: { limit: 1, ...paramsFiltro(filtros) } })
        .then((r) => (r.data?.total as number) ?? 0),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

// Trae TODOS los leads web que coinciden con los filtros, paginando hasta
// el final. Solo para el export CSV.
async function fetchTodos(filtros: FiltrosWeb): Promise<LeadFormularioWeb[]> {
  const todos: LeadFormularioWeb[] = [];
  for (let offset = 0; offset < MAX; offset += LOTE) {
    const r = await api.get("/api/crm/formularios/web", {
      params: { limit: LOTE, offset, ...paramsFiltro(filtros) },
    });
    const page: LeadFormularioWeb[] = r.data?.formularios ?? [];
    todos.push(...page);
    if (page.length < LOTE) break;
  }
  return todos;
}

export function useTodosFormulariosWeb(filtros: FiltrosWeb, enabled = false) {
  return useQuery<LeadFormularioWeb[]>({
    queryKey: ["formularios-web-todos", ...claveFiltros(filtros)],
    queryFn: () => fetchTodos(filtros),
    staleTime: 55_000,
    enabled,
  });
}

// Filas planas fuente → medio → campaña (GET /formularios/web/funnel); los
// vacíos ya vienen resueltos del backend a "(directo)" / "(sin medio)" /
// "(sin campaña)"
export function useFormulariosWebFunnel(filtros: FiltrosWeb) {
  return useQuery<FilaCanal[]>({
    queryKey: ["formularios-web-funnel", ...claveFiltros(filtros)],
    queryFn: () =>
      api
        .get("/api/crm/formularios/web/funnel", { params: paramsFiltro(filtros) })
        .then((r) =>
          (Array.isArray(r.data) ? r.data : []).map((f: Record<string, unknown>) => ({
            n1: (typeof f.utm_source === "string" && f.utm_source.trim()) || "(directo)",
            n2: (typeof f.utm_medium === "string" && f.utm_medium.trim()) || "(sin medio)",
            n3: (typeof f.utm_campaign === "string" && f.utm_campaign.trim()) || "(sin campaña)",
            funnel: funnelDe(Number(f.leads) || 0, Number(f.derivados) || 0),
          }))
        ),
    refetchInterval: 60_000,
  });
}
