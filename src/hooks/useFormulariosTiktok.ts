import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { funnelDe, type FilaCanal } from "@/lib/canalFunnel";
import type { Funnel } from "@/lib/formulariosFunnel";
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

export interface CreativoTiktok {
  anuncio: string;
  campana: string;
  thumbnailUrl: string;
  videoUrl: string | null;
  funnel: Funnel;
}

function creativosTiktokDeFilas(filas: Record<string, unknown>[]): CreativoTiktok[] {
  const txt = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const grupos = new Map<string, { anuncio: string; campana: string; thumb: string; video: string; leads: number; deriv: number }>();
  for (const f of filas) {
    const key = txt(f.ad_id) || txt(f.ad_name) || "(sin anuncio)";
    const anuncio = txt(f.ad_name) || "(sin anuncio)";
    const g = grupos.get(key) ?? { anuncio, campana: txt(f.campaign_name) || "(sin campaña)", thumb: "", video: "", leads: 0, deriv: 0 };
    if (!g.thumb && txt(f.thumbnail_url)) g.thumb = txt(f.thumbnail_url);
    if (!g.video && txt(f.video_url)) g.video = txt(f.video_url);
    g.leads += Number(f.leads) || 0;
    g.deriv += Number(f.derivados) || 0;
    grupos.set(key, g);
  }
  return [...grupos.entries()]
    .map(([, g]) => ({
      anuncio: g.anuncio,
      campana: g.campana,
      thumbnailUrl: g.thumb,
      videoUrl: g.video || null,
      funnel: funnelDe(g.leads, g.deriv),
    }))
    .sort((a, b) => b.funnel.leads - a.funnel.leads);
}

// Las filas crudas de /formularios/tiktok/funnel bajo una única queryKey:
// el funnel y los creativos comparten esta consulta (React Query hace UNA
// sola llamada) y cada uno la transforma con su propio `select`.
type FilaRaw = Record<string, unknown>;
function opcionesFilas(filtros: FiltrosTiktok) {
  return {
    queryKey: ["formularios-tiktok-funnel", ...claveFiltros(filtros)],
    queryFn: (): Promise<FilaRaw[]> =>
      api
        .get("/api/crm/formularios/tiktok/funnel", { params: paramsFiltro(filtros) })
        .then((r) => (Array.isArray(r.data) ? (r.data as FilaRaw[]) : [])),
    refetchInterval: 60_000,
  };
}

export function useFormulariosTiktokCreativos(filtros: FiltrosTiktok) {
  return useQuery({
    ...opcionesFilas(filtros),
    select: creativosTiktokDeFilas,
  });
}

// Filas planas campaña → anuncio → proyecto (GET /formularios/tiktok/funnel),
// mapeadas a los 3 niveles genéricos de arbolCanal (lib/canalFunnel.ts)
export function useFormulariosTiktokFunnel(filtros: FiltrosTiktok) {
  return useQuery({
    ...opcionesFilas(filtros),
    select: (rows: FilaRaw[]): FilaCanal[] =>
      rows.map((f) => ({
        n1: (typeof f.campaign_name === "string" && f.campaign_name.trim()) || "(sin campaña)",
        n2: (typeof f.ad_name === "string" && f.ad_name.trim()) || "(sin anuncio)",
        // Ya viene resuelto a "Sin proyecto" desde el backend
        n3: (typeof f.proyecto_nombre === "string" && f.proyecto_nombre.trim()) || "Sin proyecto",
        funnel: funnelDe(Number(f.leads) || 0, Number(f.derivados) || 0),
      })),
  });
}
