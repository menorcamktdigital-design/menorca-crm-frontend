export type EstadoLead =
  | "nuevo"
  | "en_conversacion"
  | "derivado"
  | "no_contesta"
  | "no_interesado"
  | "visita_agendada"
  | "recontacto";

export interface Contacto {
  numero: string;
  nombre: string | null;
  estado: EstadoLead;
  proyecto_interes: string | null;
  ultimo_mensaje: string | null;
  ultima_actividad: string | null; // ISO date
  total_mensajes: number;
  // Atribución del primer touch (columnas first_* de contactos, siempre
  // presentes en la fila aunque no estén en este tipo mínimo — SELECT c.*)
  creado_en?: string | null;
  first_source_type?: string | null;
  first_campaign_id?: string | null;
  first_campaign_name?: string | null;
  first_adset_id?: string | null;
  first_adset_name?: string | null;
  first_ad_id?: string | null;
  first_ad_name?: string | null;
  first_utm_source?: string | null;
  first_utm_medium?: string | null;
  first_utm_campaign?: string | null;
  first_utm_content?: string | null;
  first_utm_term?: string | null;
}

// GET /api/crm/contactos/:numero/ficha
export interface Touch {
  id: number;
  celular: string;
  source_type: string;
  meta_source_id: string | null;
  meta_headline: string | null;
  meta_body: string | null;
  meta_media_type: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  is_first_touch: boolean;
  created_at: string;
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface FichaContacto {
  contacto: Contacto;
  touches: Touch[];
}

export interface Mensaje {
  id?: number;
  rol: "user" | "assistant";
  mensaje: string;
  media_url?: string | null;
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
  meta_ads?: number;
  directo?: number;
  sin_atribuir?: number;
  acelerador?: number;
  referido?: number;
  conversando: number;
  derivados: number;
  visitas: number;
  recontactos?: number;
  no_contesta?: number;
  no_interesado?: number;
}

// GET /api/crm/stats/proyectos — conteo por proyecto agrupado en el backend
// (incluye "Sin proyecto"; los totales llegan como string)
export interface StatsProyecto {
  proyecto_interes: string;
  total: string;
  derivados: string;
}

// GET /api/crm/stats/actividad — últimos 14 días calculados en el backend.
// derivados = derivados_meta + derivados_directo (el filtro base del
// backend excluye leads sin first_source_type)
export interface StatsActividad {
  fecha: string;
  total: string;
  derivados: string;
  derivados_meta: string;
  derivados_directo: string;
}

// GET /api/crm/visitas — contactos con estado visita_agendada (fila
// completa de contactos; fecha_visita solo si la columna existe en la BD)
export interface Visita extends Contacto {
  fecha_visita?: string | null;
}

// GET /api/crm/formularios — leads capturados por formularios de Meta
// (Instant Forms), separados de la conversación de WhatsApp
export interface LeadFormulario {
  id: number
  ad_id: string,
  creado_en: string
  derivado: boolean
  documento: string
  email: string
  id_sperant: number
  leadgen_id: string
  nombre: string
  numero: string
  proyecto_nombre:string | null
  utm_campaign: string | null
  utm_content: string
  utm_term: string
}

// GET /api/crm/formularios/stats
export interface FormulariosStats {
  total: number;
  derivados: number;
  ratioDerivacion: number | null;
  campanas: number;
}

// GET /api/crm/formularios/tiktok — leads de formularios de TikTok Lead
// Generation. TikTok no manda UTMs: el webhook guarda los nombres reales
// de campaña/anuncio (campaign_name, ad_name) y el ad_id.
export interface LeadFormularioTiktok {
  id: number;
  numero: string;
  nombre: string;
  email: string | null;
  proyecto_nombre: string | null;
  id_sperant: number | null;
  campaign_name: string | null;
  ad_name: string | null;
  ad_id: string | null;
  page_name: string | null;
  derivado: boolean;
  creado_en: string;
}

// GET /api/crm/formularios/web — leads del formulario de la web
// (menorca.pe), atribuidos por UTMs (organic, Google Ads pmax/cpc, etc.)
export interface LeadFormularioWeb {
  id: number;
  numero: string;
  nombre: string;
  proyecto_nombre: string | null;
  id_sperant: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  derivado: boolean;
  creado_en: string;
}

// Configuración de badge por estado
export const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  en_conversacion: { label: "Conversando", className: "bg-amber-100 text-amber-800" },
  derivado: { label: "Derivado", className: "bg-green-100 text-green-800" },
  no_contesta: { label: "No contesta", className: "bg-gray-100 text-gray-800" },
  no_interesado: { label: "No interesado", className: "bg-red-100 text-red-800" },
  visita_agendada: { label: "Visita", className: "bg-blue-100 text-blue-800" },
  nuevo: { label: "Nuevo", className: "bg-slate-100 text-slate-600" },
  recontacto: { label: "Recontacto", className: "bg-orange-100 text-orange-800" },
};
