import type { RangoFechas, Stats, StatsActividad, StatsProyecto } from "@/types";
import { OTROS, SIN_PROYECTO, esOficial, proyectosDeTexto } from "@/lib/proyectos";
import { ESTADO_CHART, MUTED } from "./chartTheme";

// Convierte las respuestas de los endpoints agregados del backend
// (/stats, /stats/proyectos, /stats/actividad) a la forma que consumen
// las gráficas del dashboard. El filtro por plaza también se resuelve en
// el backend (?proyecto=...), así que estas son las únicas fuentes.

export interface ValoresTiles {
  leads: number;
  meta_ads: number;
  directo: number;
  sin_atribuir: number;
  acelerador: number;
  referido: number;
  conversando: number;
  derivados: number;
  visitas: number;
  recontactos: number;
  no_contesta: number;
  no_interesado: number;
}

export interface DatoDonut {
  key: string;
  label: string;
  color: string;
  valor: number;
}

export interface DiaActividad {
  label: string;
  leads: number;
  derivados: number;
  // desglose de derivados por fuente del lead (Meta Ads vs directo)
  derivadosMeta: number;
  derivadosDirecto: number;
  // % derivados/conversaciones del día (null cuando no hubo actividad)
  ratio: number | null;
}

export const DIAS_ACTIVIDAD = 14;

export function tilesDesdeStats(s: Stats): ValoresTiles {
  return {
    leads: Number(s.total) || 0,
    meta_ads: Number(s.meta_ads) || 0,
    directo: Number(s.directo) || 0,
    sin_atribuir: Number(s.sin_atribuir) || 0,
    acelerador: Number(s.acelerador) || 0,
    referido: Number(s.referido) || 0,
    conversando: Number(s.conversando) || 0,
    derivados: Number(s.derivados) || 0,
    visitas: Number(s.visitas) || 0,
    recontactos: Number(s.recontactos) || 0,
    no_contesta: Number(s.no_contesta) || 0,
    no_interesado: Number(s.no_interesado) || 0,
  };
}

// /stats no desglosa 'nuevo' ni 'frío': lo que no es conversando/derivado/
// visita/recontacto se agrupa en una porción neutra "Otros"
export function donutDesdeStats(s: Stats): DatoDonut[] {
  const por: Record<string, number> = {
    en_conversacion: s.conversando,
    derivado: s.derivados,
    visita_agendada: s.visitas ?? 0,
  };
  if (s.recontactos !== undefined) por.recontacto = s.recontactos;
  if (s.no_contesta !== undefined) por.no_contesta = Number(s.no_contesta) || 0;
  if (s.no_interesado !== undefined) por.no_interesado = Number(s.no_interesado) || 0;
  const datos = ESTADO_CHART.filter((e) => e.key in por).map((e) => ({
    ...e,
    valor: por[e.key],
  }));
  const resto = s.total - datos.reduce((acc, d) => acc + d.valor, 0);
  if (resto > 0) datos.push({ key: "otros", label: "Otros", color: MUTED, valor: resto });
  return datos.filter((d) => d.valor > 0);
}

export interface ConteoPlaza {
  total: number;
  derivados: number;
}

// El backend agrupa por el texto libre tal cual está en la BD: acá cada
// grupo se mapea a nombres oficiales (un texto con varios proyectos suma
// su total en cada uno, igual que el conteo por contacto)
export function plazasDesdeStats(rows: StatsProyecto[]): Map<string, ConteoPlaza> {
  const conteos = new Map<string, ConteoPlaza>();
  const sumar = (k: string, total: number, derivados: number) => {
    const actual = conteos.get(k) ?? { total: 0, derivados: 0 };
    conteos.set(k, { total: actual.total + total, derivados: actual.derivados + derivados });
  };
  for (const r of rows) {
    const n = Number(r.total) || 0;
    const d = Number(r.derivados) || 0;
    const raw = r.proyecto_interes?.trim();
    if (!raw || raw === SIN_PROYECTO) {
      sumar(SIN_PROYECTO, n, d);
      continue;
    }
    const proyectos = proyectosDeTexto(raw);
    if (proyectos.length === 0) {
      sumar(SIN_PROYECTO, n, d);
      continue;
    }
    for (const p of proyectos) sumar(esOficial(p) ? p : OTROS, n, d);
  }
  return conteos;
}

// Escala de días con clave local yyyy-mm-dd para cruzar contra fechas del
// backend sin corrimiento por zona horaria. Sin rango: últimos 14 días.
// Con rango sigue desde/hasta (solo "desde" → hasta hoy; solo "hasta" →
// 14 días hacia atrás). Tope de 366 puntos contados desde el final para
// no degradar el render con rangos absurdos.
function escalaDias(rango?: RangoFechas): {
  key: string;
  label: string;
  leads: number;
  derivados: number;
  derivadosMeta: number;
  derivadosDirecto: number;
}[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const parse = (s: string) => new Date(`${s}T00:00:00`);

  const fin = rango?.hasta ? parse(rango.hasta) : hoy;
  const inicio = rango?.desde ? parse(rango.desde) : new Date(fin);
  if (!rango?.desde) inicio.setDate(fin.getDate() - (DIAS_ACTIVIDAD - 1));

  const minimo = new Date(fin);
  minimo.setDate(fin.getDate() - 365);
  if (inicio < minimo) inicio.setTime(minimo.getTime());

  const pad = (n: number) => String(n).padStart(2, "0");
  const dias = [];
  for (const f = new Date(inicio); f <= fin; f.setDate(f.getDate() + 1)) {
    dias.push({
      key: `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`,
      label: f.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
      leads: 0,
      derivados: 0,
      derivadosMeta: 0,
      derivadosDirecto: 0,
    });
  }
  return dias;
}
//calculo de ratio de derivados/conversaciones del día
export function actividadDesdeStats(
  rows: StatsActividad[],
  rango?: RangoFechas
): DiaActividad[] {
  const dias = escalaDias(rango);
  for (const r of rows) {
    const dia = dias.find((d) => d.key === r.fecha.slice(0, 10));
    if (!dia) continue;
    dia.leads = Number(r.total) || 0;
    dia.derivados = Number(r.derivados) || 0;
    dia.derivadosMeta = Number(r.derivados_meta) || 0;
    dia.derivadosDirecto = Number(r.derivados_directo) || 0;
  }
  return dias.map((d) => ({
    ...d,
    ratio: d.leads > 0 ? Math.round((d.derivados / d.leads) * 1000) / 10 : null,
  }));
}
