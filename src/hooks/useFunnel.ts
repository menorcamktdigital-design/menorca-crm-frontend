import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  campanasDeApi,
  mesesDeApi,
  plazasDeApi,
  sinPlazaDeApi,
  type CampanaFunnel,
  type FunnelMes,
  type FunnelPlaza,
  type SinPlaza,
  webDeApi,
  type Web,
} from "@/lib/funnel";
import type { RangoFechas } from "@/types";

// Endpoints del funnel de marketing. Leen las tablas mkt_* que n8n acumula a
// diario, así que no hay llamadas a APIs externas: la respuesta es instantánea
// y el refetch puede ser lento (los datos solo cambian una vez al día).
const REFETCH = 5 * 60_000;

function params(plaza?: string, rango?: RangoFechas) {
  return {
    ...(plaza && { plaza }),
    ...(rango?.desde && { desde: rango.desde }),
    ...(rango?.hasta && { hasta: rango.hasta }),
  };
}

const clave = (plaza?: string, rango?: RangoFechas) => [
  plaza ?? "todas",
  rango?.desde ?? "",
  rango?.hasta ?? "",
];

const filas = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data : [];

export function useFunnelResumen(plaza?: string, rango?: RangoFechas) {
  return useQuery<FunnelMes[]>({
    queryKey: ["funnel-resumen", ...clave(plaza, rango)],
    queryFn: () =>
      api
        .get("/api/crm/funnel/resumen", { params: params(plaza, rango) })
        .then((r) => mesesDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

export function useFunnelPlazas(plaza?: string, rango?: RangoFechas) {
  return useQuery<FunnelPlaza[]>({
    queryKey: ["funnel-plazas", ...clave(plaza, rango)],
    queryFn: () =>
      api
        .get("/api/crm/funnel/plazas", { params: params(plaza, rango) })
        .then((r) => plazasDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

export function useFunnelCampanas(plaza?: string, rango?: RangoFechas) {
  return useQuery<CampanaFunnel[]>({
    queryKey: ["funnel-campanas", ...clave(plaza, rango)],
    queryFn: () =>
      api
        .get("/api/crm/funnel/campanas", { params: params(plaza, rango) })
        .then((r) => campanasDeApi(filas(r.data))),
    refetchInterval: REFETCH,
  });
}

export function useFunnelSinPlaza(rango?: RangoFechas) {
  return useQuery<SinPlaza>({
    queryKey: ["funnel-sin-plaza", ...clave(undefined, rango)],
    queryFn: () =>
      api
        .get("/api/crm/funnel/sin-plaza", { params: params(undefined, rango) })
        .then((r) => sinPlazaDeApi(r.data)),
    refetchInterval: REFETCH,
  });
}

export function useFunnelWeb(rango?: RangoFechas) {
  return useQuery<Web>({
    queryKey: ["funnel-web", ...clave(undefined, rango)],
    queryFn: () =>
      api
        .get("/api/crm/funnel/web", { params: params(undefined, rango) })
        .then((r) => webDeApi(r.data)),
    refetchInterval: REFETCH,
  });
}
