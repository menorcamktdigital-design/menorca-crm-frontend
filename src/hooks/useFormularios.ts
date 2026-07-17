import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { filasFunnelDeApi, type FilaFunnel } from "@/lib/formulariosFunnel";
import type { FormulariosStats, LeadFormulario, RangoFechas } from "@/types";

export const PAGINA = 50;
const LOTE = 500;
const MAX = 20000;

// Filtros de la vista de formularios: un proyecto (mismo criterio de texto
// libre que /contactos, matchea por LIKE en el backend), campaña por texto
// y rango de fechas sobre creado_en.
export interface FiltrosFormularios {
  proyecto?: string;
  utmCampaign?: string;
  rango?: RangoFechas;
}

function paramsFiltro(filtros: FiltrosFormularios) {
  return {
    ...(filtros.proyecto && { proyecto: filtros.proyecto }),
    ...(filtros.utmCampaign && { utm_campaign: filtros.utmCampaign }),
    ...(filtros.rango?.desde && { desde: filtros.rango.desde }),
    ...(filtros.rango?.hasta && { hasta: filtros.rango.hasta }),
  };
}

const claveFiltros = (f: FiltrosFormularios) => [
  f.proyecto ?? "",
  f.utmCampaign ?? "",
  f.rango?.desde ?? "",
  f.rango?.hasta ?? "",
];

export function useFormulariosStats(filtros: FiltrosFormularios) {
  return useQuery<FormulariosStats>({
    queryKey: ["formularios-stats", ...claveFiltros(filtros)],
    // Los conteos llegan como string (COUNT/ROUND de Postgres): se
    // convierten acá para que el componente reciba números de verdad
    queryFn: () =>
      api
        .get("/api/crm/formularios/stats", { params: paramsFiltro(filtros) })
        .then((r) => ({
          total: Number(r.data.total) || 0,
          derivados: Number(r.data.derivados) || 0,
          ratioDerivacion: r.data.ratio_derivacion != null ? Number(r.data.ratio_derivacion) : null,
          campanas: Number(r.data.campanas) || 0,
        })),
    refetchInterval: 30_000,
  });
}

export function useFormulariosPagina(pagina: number, filtros: FiltrosFormularios) {
  return useQuery({
    queryKey: ["formularios-pagina", ...claveFiltros(filtros), pagina],
    queryFn: () =>
      api
        .get("/api/crm/formularios", {
          params: { limit: PAGINA, offset: (pagina - 1) * PAGINA, ...paramsFiltro(filtros) },
        })
        .then((r) => ({
          formularios: (r.data?.formularios as LeadFormulario[]) ?? [],
          total: (r.data?.total as number) ?? 0,
        })),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

// Trae TODOS los formularios que coinciden con los filtros, paginando hasta
// el final. Se usa solo en el export CSV, no en la vista de tabla.
async function fetchTodos(filtros: FiltrosFormularios): Promise<LeadFormulario[]> {
  const todos: LeadFormulario[] = [];
  for (let offset = 0; offset < MAX; offset += LOTE) {
    const r = await api.get("/api/crm/formularios", {
      params: { limit: LOTE, offset, ...paramsFiltro(filtros) },
    });
    const page: LeadFormulario[] = r.data?.formularios ?? [];
    todos.push(...page);
    if (page.length < LOTE) break;
  }
  return todos;
}

export function useTodosFormularios(filtros: FiltrosFormularios, enabled = false) {
  return useQuery<LeadFormulario[]>({
    queryKey: ["formularios-todos", ...claveFiltros(filtros)],
    queryFn: () => fetchTodos(filtros),
    staleTime: 55_000,
    enabled,
  });
}

// Filas planas para el funnel jerárquico campaña → conjunto → anuncio →
// proyecto (GET /formularios/funnel). El árbol se arma en cliente con
// arbolFunnel (lib/formulariosFunnel.ts).
export function useFormulariosFunnel(filtros: FiltrosFormularios) {
  return useQuery<FilaFunnel[]>({
    queryKey: ["formularios-funnel", ...claveFiltros(filtros)],
    queryFn: () =>
      api
        .get("/api/crm/formularios/funnel", { params: paramsFiltro(filtros) })
        .then((r) => filasFunnelDeApi(Array.isArray(r.data) ? r.data : [])),
    refetchInterval: 60_000,
  });
}
