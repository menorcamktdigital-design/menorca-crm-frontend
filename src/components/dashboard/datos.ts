import type { Stats, StatsActividad, StatsProyecto } from "@/types";
import { OTROS, SIN_PROYECTO, esOficial, proyectosDeTexto } from "@/lib/proyectos";
import { ESTADO_CHART, MUTED } from "./chartTheme";

// Convierte las respuestas de los endpoints agregados del backend
// (/stats, /stats/proyectos, /stats/actividad) a la forma que consumen
// las gráficas del dashboard. El filtro por plaza también se resuelve en
// el backend (?proyecto=...), así que estas son las únicas fuentes.

export interface ValoresTiles {
  leads: number;
  conversando: number;
  derivados: number;
  visitas: number;
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
}

export const DIAS_ACTIVIDAD = 14;

export function tilesDesdeStats(s: Stats): ValoresTiles {
  return {
    leads: s.total,
    conversando: s.conversando,
    derivados: s.derivados,
    visitas: s.visitas ?? 0,
  };
}

// /stats no desglosa 'nuevo' ni 'frío': lo que no es conversando/derivado/
// visita se agrupa en una porción neutra "Otros"
export function donutDesdeStats(s: Stats): DatoDonut[] {
  const por: Record<string, number> = {
    en_conversacion: s.conversando,
    derivado: s.derivados,
    visita_agendada: s.visitas ?? 0,
  };
  const datos = ESTADO_CHART.filter((e) => e.key in por).map((e) => ({
    ...e,
    valor: por[e.key],
  }));
  const resto = s.total - datos.reduce((acc, d) => acc + d.valor, 0);
  if (resto > 0) datos.push({ key: "otros", label: "Otros", color: MUTED, valor: resto });
  return datos.filter((d) => d.valor > 0);
}

// El backend agrupa por el texto libre tal cual está en la BD: acá cada
// grupo se mapea a nombres oficiales (un texto con varios proyectos suma
// su total en cada uno, igual que el conteo por contacto)
export function plazasDesdeStats(rows: StatsProyecto[]): Map<string, number> {
  const conteos = new Map<string, number>();
  const sumar = (k: string, n: number) => conteos.set(k, (conteos.get(k) || 0) + n);
  for (const r of rows) {
    const n = Number(r.total) || 0;
    const raw = r.proyecto_interes?.trim();
    if (!raw || raw === SIN_PROYECTO) {
      sumar(SIN_PROYECTO, n);
      continue;
    }
    const proyectos = proyectosDeTexto(raw);
    if (proyectos.length === 0) {
      sumar(SIN_PROYECTO, n);
      continue;
    }
    for (const p of proyectos) sumar(esOficial(p) ? p : OTROS, n);
  }
  return conteos;
}

// Escala fija de los últimos 14 días (con clave local yyyy-mm-dd para
// cruzar contra fechas del backend sin corrimiento por zona horaria)
function escalaDias(): { key: string; label: string; leads: number; derivados: number }[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = [];
  for (let i = DIAS_ACTIVIDAD - 1; i >= 0; i--) {
    const f = new Date(hoy);
    f.setDate(hoy.getDate() - i);
    const pad = (n: number) => String(n).padStart(2, "0");
    dias.push({
      key: `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`,
      label: f.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
      leads: 0,
      derivados: 0,
    });
  }
  return dias;
}

export function actividadDesdeStats(rows: StatsActividad[]): DiaActividad[] {
  const dias = escalaDias();
  for (const r of rows) {
    const dia = dias.find((d) => d.key === r.fecha.slice(0, 10));
    if (!dia) continue;
    dia.leads = Number(r.total) || 0;
    dia.derivados = Number(r.derivados) || 0;
  }
  return dias;
}
