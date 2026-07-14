export type EstadoLead =
  | "nuevo"
  | "en_conversacion"
  | "derivado"
  | "frio"
  | "visita_agendada"
  | "recontacto"; // fallback legacy — mapear a 'derivado' en UI

export interface Contacto {
  numero: string;
  nombre: string | null;
  estado: EstadoLead;
  proyecto_interes: string | null;
  ultimo_mensaje: string | null;
  ultima_actividad: string | null; // ISO date
  total_mensajes: number;
}

export interface Mensaje {
  id?: number;
  rol: "user" | "assistant";
  mensaje: string;
  fecha: string; // ISO date
}

// Filtro por fecha (YYYY-MM-DD, hasta inclusivo). El backend lo aplica
// sobre creado_en (/stats, /stats/proyectos, /contactos) y sobre la
// actividad diaria (/stats/actividad). Vacío/undefined = sin filtro.
export interface RangoFechas {
  desde?: string;
  hasta?: string;
}

export interface Stats {
  total: number;
  conversando: number;
  derivados: number;
  visitas: number;
}

// GET /api/crm/stats/proyectos — conteo por proyecto agrupado en el backend
// (incluye "Sin proyecto"; los totales llegan como string)
export interface StatsProyecto {
  proyecto_interes: string;
  total: string;
}

// GET /api/crm/stats/actividad — últimos 14 días calculados en el backend
export interface StatsActividad {
  fecha: string;
  total: string;
  derivados: string;
}

export interface Visita {
  numero: string;
  nombre: string | null;
  proyecto: string | null;
  fecha_visita: string | null;
}

// Configuración de badge por estado
// 'recontacto' es legacy en BD → se muestra como 'Derivado'
export const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  en_conversacion: { label: "Conversando", className: "bg-amber-100 text-amber-800" },
  derivado: { label: "Derivado", className: "bg-green-100 text-green-800" },
  frio: { label: "Frío", className: "bg-slate-100 text-slate-600" },
  visita_agendada: { label: "Visita", className: "bg-blue-100 text-blue-800" },
  nuevo: { label: "Nuevo", className: "bg-slate-100 text-slate-600" },
  recontacto: { label: "Derivado", className: "bg-green-100 text-green-800" },
};
