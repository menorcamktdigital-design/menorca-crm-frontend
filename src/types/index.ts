export type EstadoLead =
  | "nuevo"
  | "en_conversacion"
  | "derivado"
  | "no_contesta"
  | "no_interesado"
  | "visita_agendada"
  | "recontacto"
  // Ya gestionado en Sperant por una via distinta de WhatsApp (tiktok, web,
  // facebook). No lo derivó la IA, así que no debe contarse como derivado propio.
  | "derivado_otro_canal";

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

export type EstadoEntrega = "sent" | "delivered" | "read" | "failed";
export type MediaType = "image" | "video" | "audio" | "document";

export interface Mensaje {
  id?: number;
  rol: "user" | "assistant";
  mensaje: string;
  media_url?: string | null;
  media_type?: MediaType | null;
  fecha: string; // ISO date
  estado_entrega?: EstadoEntrega | null;
  wamid?: string | null;
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
  total_meta: string;
  total_directo: string;
  derivados: string;
  derivados_meta: string;
  derivados_directo: string;
}

// GET /api/crm/visitas — contactos con estado visita_agendada (fila
// completa de contactos + fecha_visita, que el backend trae de la tabla
// `visitas`). Es null en visitas antiguas agendadas antes de que el
// agente empezara a guardar la fecha.
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

// GET /api/ventas/historico — ventas del mes cruzadas con interacciones de Sperant
export interface VentaAtribuida {
  documento: string;
  // Llave 1:1 con la interacción "creación de proforma" que cerró esta venta
  codigo_proforma: string;
  codigo_proyecto: number;
  nombre_proyecto: string;
  codigo_unidad: string;
  tipo_unidad: string;
  precio_lista: number;
  moneda: string;
  fecha_cierre: string;
  estado_contrato: string;
  vendedor: string;

  // Origen: primera interacción del cliente hasta la fecha de la proforma.
  // De dónde vino la venta. `canal` conserva el nombre por compatibilidad.
  canal: string;
  medio: string | null;
  fecha_origen: string | null;

  // Cierre: el medio registrado en la interacción de la proforma. Quién la
  // cerró. Difiere del origen en 54 de las 135 ventas de junio 2026.
  canal_cierre: string;
  medio_cierre: string | null;
  fecha_proforma: string | null;
  dias_ciclo: number | null;

  utm_source: string | null;
  utm_campaign: string | null;
  // Nivel de anuncio: Sperant lo manda como texto en utm_content. El ad_id se
  // resuelve cruzando ese nombre contra Meta (null si no hay token o no cruza).
  utm_content: string | null;
  // false cuando los UTM salen de una interacción posterior a la del origen
  utm_del_origen: boolean;
  // true cuando el anuncio corresponde a un proyecto distinto al vendido: el
  // cliente entró por un aviso de un proyecto y terminó comprando otro
  utm_otro_proyecto: boolean;
  ad_id: string | null;
  // true si hay varios anuncios en Meta con el mismo nombre: el cruce es por
  // nombre y el ad_id elegido puede no ser el correcto
  ad_ambiguo: boolean;
  // Nombre real de la campaña en Meta, resuelto desde el ad_id. El utm_campaign
  // de Sperant no corresponde a ninguna entidad de la cuenta publicitaria.
  campana_meta: string | null;
}

/**
 * Los montos no se pueden sumar en un solo número: hay contratos en USD y en
 * PEN, y no existe un tipo de cambio en la data. Se acumulan por moneda y la UI
 * los muestra por separado en vez de inventar una conversión.
 */
export type MontoPorMoneda = Record<string, number>;

/* ---------- Gasto de Meta ------------------------------------------------ */
export interface MetricasAnuncio {
  gasto: number;
  impresiones: number;
  leads: number;
  /** null cuando no hubo leads: dividir daría infinito */
  cpl: number | null;
}

export interface MetricasMeta {
  /** ad_id -> métricas del período */
  porAnuncio: Record<string, MetricasAnuncio>;
  /**
   * Total de la cuenta, incluidos los anuncios que no vendieron. Sin esto el
   * costo por venta sale falsamente bajo, porque solo se dividiría el gasto de
   * los anuncios que sí cerraron.
   */
  totalCuenta: MetricasAnuncio;
  desde: string;
  hasta: string;
  /** false cuando Meta falló y los números vienen de cache viejo o vacío */
  completo: boolean;
}

/** Gasto agregado de un grupo, con el costo por venta ya calculado. */
export interface GastoGrupo {
  gasto: number;
  leads: number;
  cpl: number | null;
  /** null cuando el grupo no tiene ningún anuncio con gasto conocido */
  costoPorVenta: number | null;
  /** cuántos anuncios del grupo tienen gasto conocido */
  anunciosConGasto: number;
}

// Anuncio dentro de una campaña. `ad_id` no nulo permite el link directo a
// Ads Manager; si es null solo queda el nombre en texto.
export interface ResumenAnuncio {
  nombre: string;
  total: number;
  montos: MontoPorMoneda;
  ad_id: string | null;
  ad_ambiguo: boolean;
  // cuántas de las ventas del grupo entraron por un aviso de otro proyecto
  otroProyecto: number;
  // gasto del anuncio en Meta; null si no hay ad_id o si Meta no lo devolvió
  metricas: MetricasAnuncio | null;
}

export interface ResumenCampana {
  nombre: string;
  total: number;
  montos: MontoPorMoneda;
  // true cuando el nombre viene de Meta; false cuando es el utm_campaign de
  // Sperant, que no corresponde a ninguna campaña real
  esCampanaMeta: boolean;
  gasto: GastoGrupo | null;
  anuncios: ResumenAnuncio[];
}

export interface ResumenCanal {
  canal: string;
  total: number;
  montos: MontoPorMoneda;
  gasto: GastoGrupo | null;
  campanas: ResumenCampana[];
}

export interface VentasHistoricoData {
  // Forma del JSON cacheado. Un mes con versión vieja se re-sincroniza solo.
  version?: number;
  mes: number;
  total: number;
  por_canal: ResumenCanal[];
  ventas: VentaAtribuida[];
  // Viaja en el JSON para que la UI pueda reagrupar al filtrar por proyecto o
  // cambiar de origen a cierre sin volver a pedirle nada al servidor
  metricas_meta?: MetricasMeta;
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
  derivado_otro_canal: {
    label: "Derivado (otro canal)",
    className: "bg-teal-100 text-teal-800",
  },
};
