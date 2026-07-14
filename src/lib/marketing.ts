// Tipos y normalización de los endpoints de marketing/atribución:
// /stats/fuentes, /stats/campanas, /stats/anuncios,
// /stats/anuncios/:anuncio/proyectos, /stats/creativos y /stats/multitouch.
//
// Forma real del backend (Postgres vía n8n, conteos como string):
//   { total_leads, derivados, en_conversacion, frios, tasa_derivacion_pct }
// (/stats/fuentes usa `total` en vez de `total_leads`). Acá todo se
// convierte a número una sola vez para que los componentes reciban datos
// listos.

type Row = Record<string, unknown>;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

// Postgres/n8n pueden serializar booleanos como "true" / "t" / "1"
const bool = (v: unknown): boolean =>
  v === true || v === "true" || v === "t" || v === "1" || v === 1;

// "{{product.name}}" y similares: texto de catálogo dinámico que Meta no
// resolvió — no sirve como nombre visible
export const esPlaceholder = (s: string) => /\{\{.+\}\}/.test(s);

export interface Funnel {
  leads: number;
  conversando: number;
  derivados: number;
  frios: number;
  ratio: number | null; // % derivados/leads (null sin leads)
}

const ratioDe = (derivados: number, leads: number): number | null =>
  leads > 0 ? Math.round((derivados / leads) * 1000) / 10 : null;

function funnelDe(r: Row): Funnel {
  const leads = num(r.total ?? r.total_leads ?? r.leads);
  const derivados = num(r.derivados);
  return {
    leads,
    conversando: num(r.en_conversacion ?? r.conversando),
    derivados,
    frios: num(r.frios),
    // el backend ya calcula la tasa; si falta, se deriva acá
    ratio: r.tasa_derivacion_pct != null ? num(r.tasa_derivacion_pct) : ratioDe(derivados, leads),
  };
}

const porLeads = <T extends Funnel>(a: T, b: T) => b.leads - a.leads;

function sumarFunnels(items: Funnel[]): Funnel {
  const s = items.reduce(
    (acc, f) => ({
      leads: acc.leads + f.leads,
      conversando: acc.conversando + f.conversando,
      derivados: acc.derivados + f.derivados,
      frios: acc.frios + f.frios,
    }),
    { leads: 0, conversando: 0, derivados: 0, frios: 0 }
  );
  return { ...s, ratio: ratioDe(s.derivados, s.leads) };
}

// ---- GET /stats/fuentes — de dónde viene el lead ----

// El backend manda códigos (meta_ad, direct, sin_atribuir…)
const FUENTE_LABELS: Record<string, string> = {
  meta_ad: "Meta Ads",
  meta_ads: "Meta Ads",
  organic: "Orgánico",
  organico: "Orgánico",
  direct: "Directo",
  directo: "Directo",
  sin_atribuir: "Sin atribuir",
};

export interface Fuente extends Funnel {
  codigo: string; // código crudo del backend, para asignar color fijo
  fuente: string; // etiqueta visible
}

export function fuentesDeApi(rows: Row[]): Fuente[] {
  return rows
    .map((r) => {
      const codigo = texto(r.fuente) || "desconocido";
      return {
        codigo,
        fuente: FUENTE_LABELS[codigo.toLowerCase()] ?? codigo,
        ...funnelDe(r),
      };
    })
    .sort(porLeads);
}

// ---- GET /stats/campanas — funnel por campaña ----
// Agrupado por campaign_id real de Meta (no por el nombre de texto, que
// dos campañas distintas podrían compartir)

export interface Campana extends Funnel {
  campaignId: string;
  campana: string;
}

export function campanasDeApi(rows: Row[]): Campana[] {
  return rows
    .map((r) => ({
      campaignId: texto(r.campaign_id),
      campana: texto(r.campana) || "(sin campaña)",
      ...funnelDe(r),
    }))
    .sort(porLeads);
}

// ---- GET /stats/anuncios — funnel campaña → adset → anuncio ----
// Cada fila trae su propio ad_id: es el identificador único real de Meta.
// El nombre de texto (`anuncio`) puede repetirse entre dos anuncios
// distintos, así que nunca se usa como key.

export interface Anuncio extends Funnel {
  adId: string;
  campaignId: string;
  campana: string;
  adset: string;
  anuncio: string;
}

export function anunciosDeApi(rows: Row[]): Anuncio[] {
  return rows
    .map((r) => ({
      adId: texto(r.ad_id),
      campaignId: texto(r.campaign_id),
      campana: texto(r.campana) || "(sin campaña)",
      adset: texto(r.adset) || "(sin conjunto)",
      anuncio: texto(r.anuncio) || "(sin anuncio)",
      ...funnelDe(r),
    }))
    .sort(porLeads);
}

// Jerarquía campaña → adset → anuncio con subtotales agregados por nivel,
// cada nivel ordenado por leads. Se agrupa por campaignId/adset (no por
// nombre de texto) para no mezclar entidades distintas que comparten
// nombre.
export interface NodoAdset {
  adset: string;
  funnel: Funnel;
  anuncios: Anuncio[];
}

export interface NodoCampana {
  campaignId: string;
  campana: string;
  funnel: Funnel;
  adsets: NodoAdset[];
}

export function arbolAnuncios(anuncios: Anuncio[]): NodoCampana[] {
  const porCampana = new Map<string, { campana: string; adsets: Map<string, Anuncio[]> }>();
  for (const a of anuncios) {
    const clave = a.campaignId || a.campana;
    const entrada = porCampana.get(clave) ?? { campana: a.campana, adsets: new Map<string, Anuncio[]>() };
    porCampana.set(clave, entrada);
    entrada.adsets.set(a.adset, [...(entrada.adsets.get(a.adset) ?? []), a]);
  }
  return [...porCampana.entries()]
    .map(([campaignId, { campana, adsets }]) => {
      const nodos = [...adsets.entries()]
        .map(([adset, lista]) => ({
          adset,
          funnel: sumarFunnels(lista),
          anuncios: [...lista].sort(porLeads),
        }))
        .sort((a, b) => b.funnel.leads - a.funnel.leads);
      return {
        campaignId,
        campana,
        funnel: sumarFunnels(nodos.map((n) => n.funnel)),
        adsets: nodos,
      };
    })
    .sort((a, b) => b.funnel.leads - a.funnel.leads);
}

// ---- GET /stats/creativos — como anuncios, con el creativo real ----
// El backend devuelve UNA FILA POR LEAD (el mismo ad_id se repite n veces,
// a veces como variante de catálogo sin resolver, a veces con distinto
// derivados/leads): acá se agrupa por ad_id sumando el funnel y se muestra
// la mejor variante disponible (la resuelta y con imagen/video).

export interface Creativo extends Anuncio {
  titulo: string;
  texto: string;
  tipoMedia: "image" | "video" | null;
  imagenUrl: string | null; // imagen del anuncio o thumbnail del video
  videoUrl: string | null; // link al video en Facebook
  // true = titulo/texto son placeholders {{product.name}} sin resolver:
  // no mostrarlos como copy; identificar por imagen + campaña/adset
  esCatalogoDinamico: boolean;
}

export function creativosDeApi(rows: Row[]): Creativo[] {
  const grupos = new Map<string, Creativo[]>();
  let sinAdId = 0;
  for (const r of rows) {
    const tipo = texto(r.tipo_media).toLowerCase();
    const c: Creativo = {
      adId: texto(r.ad_id),
      campaignId: texto(r.campaign_id),
      campana: texto(r.campana) || "(sin campaña)",
      adset: texto(r.adset) || "(sin conjunto)",
      anuncio: texto(r.anuncio) || "(sin anuncio)",
      titulo: texto(r.titulo),
      texto: texto(r.texto),
      tipoMedia: tipo === "video" || tipo === "image" ? (tipo as "video" | "image") : null,
      imagenUrl: texto(r.imagen_url) || texto(r.thumbnail_url) || null,
      videoUrl: texto(r.video_url) || null,
      esCatalogoDinamico: bool(r.es_catalogo_dinamico),
      ...funnelDe(r),
    };
    // Sin ad_id no hay forma fiable de saber si dos filas son el mismo
    // anuncio: se tratan como leads separados (clave única por fila) en
    // vez de agruparlas por texto, que podría mezclar leads distintos.
    const clave = c.adId || `sin-ad-id:${sinAdId++}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), c]);
  }

  // Mejor variante para mostrar: con media > con copy real > el resto
  const puntaje = (c: Creativo) =>
    (c.imagenUrl ? 2 : 0) +
    (!c.esCatalogoDinamico && (c.titulo || c.texto) ? 1 : 0);

  return [...grupos.values()]
    .map((variantes) => {
      const mejor = variantes.reduce((a, b) => (puntaje(b) > puntaje(a) ? b : a));
      return { ...mejor, ...sumarFunnels(variantes) };
    })
    .sort(porLeads);
}

// ---- GET /stats/anuncios/proyectos?ad_id=... ----

export interface ProyectoDeAnuncio {
  proyecto: string;
  total: number;
}

export function proyectosDeAnuncioDeApi(rows: Row[]): ProyectoDeAnuncio[] {
  return rows
    .map((r) => ({
      proyecto: texto(r.proyecto_interes ?? r.proyecto) || "Sin proyecto",
      total: num(r.total ?? r.total_leads),
    }))
    .sort((a, b) => b.total - a.total);
}

// ---- GET /stats/multitouch — 1 touch vs 2+ antes de escribir ----
// Filas: { grupo: "1 touch" | "2+ touches", total_leads, derivados,
// tasa_derivacion_pct }

export interface GrupoTouch extends Funnel {
  grupo: string; // etiqueta visible
  esUnToque: boolean;
}

export function multitouchDeApi(rows: Row[]): GrupoTouch[] {
  return rows
    .map((r) => {
      const crudo = texto(r.grupo ?? r.touches ?? r.toques);
      const esUnToque = crudo.startsWith("1");
      return {
        grupo: esUnToque ? "1 toque" : "2+ toques",
        esUnToque,
        ...funnelDe(r),
      };
    })
    .sort((a, b) => Number(b.esUnToque) - Number(a.esUnToque));
}
