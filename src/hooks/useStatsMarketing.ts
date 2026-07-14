import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { paramsFiltro } from "@/hooks/useStats";
import {
  anunciosDeApi,
  campanasDeApi,
  creativosDeApi,
  fuentesDeApi,
  multitouchDeApi,
  proyectosDeAnuncioDeApi,
  type Anuncio,
  type Campana,
  type Creativo,
  type Fuente,
  type GrupoTouch,
  type ProyectoDeAnuncio,
} from "@/lib/marketing";
import type { RangoFechas } from "@/types";

// Endpoints de marketing/atribución. Todos aceptan ?proyecto=&desde=&hasta=
// y se filtran en el backend; acá solo se normaliza la respuesta
// (conteos string → número, ratios calculados) vía lib/marketing.

const REFETCH = 60_000;

const claveFiltro = (proyecto?: string, rango?: RangoFechas) => [
  proyecto ?? "todas",
  rango?.desde ?? "",
  rango?.hasta ?? "",
];

const filas = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data : [];

export function useStatsFuentes(proyecto?: string, rango?: RangoFechas) {
  return useQuery<Fuente[]>({
    queryKey: ["stats-fuentes", ...claveFiltro(proyecto, rango)],
    queryFn: () =>
      api
        .get("/api/crm/stats/fuentes", { params: paramsFiltro(proyecto, rango) })
        .then((r) => fuentesDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

export function useStatsCampanas(proyecto?: string, rango?: RangoFechas) {
  return useQuery<Campana[]>({
    queryKey: ["stats-campanas", ...claveFiltro(proyecto, rango)],
    queryFn: () =>
      api
        .get("/api/crm/stats/campanas", { params: paramsFiltro(proyecto, rango) })
        .then((r) => campanasDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

export function useStatsAnuncios(proyecto?: string, rango?: RangoFechas) {
  return useQuery<Anuncio[]>({
    queryKey: ["stats-anuncios", ...claveFiltro(proyecto, rango)],
    queryFn: () =>
      api
        .get("/api/crm/stats/anuncios", { params: paramsFiltro(proyecto, rango) })
        .then((r) => anunciosDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

export function useStatsCreativos(proyecto?: string, rango?: RangoFechas) {
  return useQuery<Creativo[]>({
    queryKey: ["stats-creativos", ...claveFiltro(proyecto, rango)],
    queryFn: () =>
      api
        .get("/api/crm/stats/creativos", { params: paramsFiltro(proyecto, rango) })
        .then((r) => creativosDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

export function useStatsMultitouch(proyecto?: string, rango?: RangoFechas) {
  return useQuery<GrupoTouch[]>({
    queryKey: ["stats-multitouch", ...claveFiltro(proyecto, rango)],
    queryFn: () =>
      api
        .get("/api/crm/stats/multitouch", { params: paramsFiltro(proyecto, rango) })
        .then((r) => multitouchDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

// Proyectos de interés de los leads de un anuncio. Se pide bajo demanda
// (al expandir un anuncio) y solo con el rango de fechas: filtrar además
// por proyecto dejaría el desglose con una sola fila, sin información.
// Filtra por ad_id (identificador único real de Meta), no por el nombre
// de texto del anuncio, que puede repetirse entre dos anuncios distintos.
export function useProyectosDeAnuncio(adId: string, rango?: RangoFechas) {
  return useQuery<ProyectoDeAnuncio[]>({
    queryKey: [
      "stats-anuncio-proyectos",
      adId,
      rango?.desde ?? "",
      rango?.hasta ?? "",
    ],
    queryFn: () =>
      api
        .get("/api/crm/stats/anuncios/proyectos", {
          params: { ad_id: adId, ...paramsFiltro(undefined, rango) },
        })
        .then((r) => proyectosDeAnuncioDeApi(filas(r.data))),
    enabled: adId.length > 0,
  });
}
