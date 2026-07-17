// Tipos y armado del árbol de /formularios/funnel: filas planas agrupadas
// por campaña → conjunto (utm_term) → anuncio (utm_content) → proyecto
// (proyecto_nombre), cada una con leads/derivados. El backend agrupa y
// cuenta; acá solo se arma la jerarquía y se suma cada nivel a partir de
// sus hijos (mismo criterio que lib/marketing.ts arbolAnuncios).
//
// El proyecto es el texto crudo de proyecto_nombre (ya resuelto a
// "Sin proyecto" si viene vacío por el backend, con COALESCE+TRIM): no se
// normaliza contra la lista oficial. No hay tabla que mapee el project_id
// de Meta a un proyecto, y el patrón real de WhatsApp
// (/stats/anuncios/proyectos) tampoco normaliza — agrupa el texto de
// proyecto_interes tal cual está en la BD.

type Row = Record<string, unknown>;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export interface Funnel {
  leads: number;
  derivados: number;
  ratio: number | null; // % derivados/leads (null sin leads)
}

const ratioDe = (derivados: number, leads: number): number | null =>
  leads > 0 ? Math.round((derivados / leads) * 1000) / 10 : null;

function funnelDe(leads: number, derivados: number): Funnel {
  return { leads, derivados, ratio: ratioDe(derivados, leads) };
}

function sumarFunnels(items: Funnel[]): Funnel {
  const leads = items.reduce((acc, f) => acc + f.leads, 0);
  const derivados = items.reduce((acc, f) => acc + f.derivados, 0);
  return funnelDe(leads, derivados);
}

export interface FilaFunnel {
  campana: string;
  conjunto: string; // utm_term
  anuncio: string; // utm_content
  adId: string;
  thumbnailUrl: string;
  videoId: string;
  proyecto: string; // proyecto_nombre
  funnel: Funnel;
}

export function filasFunnelDeApi(rows: Row[]): FilaFunnel[] {
  return rows.map((r) => ({
    campana: texto(r.utm_campaign) || "(sin campaña)",
    conjunto: texto(r.utm_term) || "(sin conjunto)",
    anuncio: texto(r.utm_content) || "(sin anuncio)",
    adId: texto(r.ad_id),
    thumbnailUrl: texto(r.thumbnail_url),
    videoId: texto(r.video_id),
    // Ya viene resuelto a "Sin proyecto" desde el backend si estaba vacío
    proyecto: texto(r.proyecto_nombre) || "Sin proyecto",
    funnel: funnelDe(num(r.leads), num(r.derivados)),
  }));
}

// ---- Creativos: agrupado por anuncio (utm_content), como CreativosGrid de
// Marketing pero con datos de leads_formulario (thumbnail/video ya vienen
// resueltos en la fila, no hay que ir a buscarlos a Meta) ----

export interface Creativo {
  anuncio: string; // utm_content
  campana: string;
  adId: string;
  thumbnailUrl: string;
  videoId: string;
  videoUrl: string | null;
  funnel: Funnel;
}

// URL pública de reproducción por ID de video de Facebook (mismo formato
// que usa Meta para videos subidos a una Página). Si el video es privado o
// el ID no es de Facebook, el enlace puede no cargar: no hay forma de
// confirmarlo sin el video_url real, que leads_formulario no guarda.
const urlVideo = (videoId: string): string | null =>
  videoId ? `https://www.facebook.com/video.php?v=${videoId}` : null;

export function creativosDeFilas(filas: FilaFunnel[]): Creativo[] {
  const grupos = new Map<string, FilaFunnel[]>();
  for (const f of filas) {
    const clave = f.anuncio;
    grupos.set(clave, [...(grupos.get(clave) ?? []), f]);
  }
  return [...grupos.entries()]
    .map(([anuncio, lista]) => {
      // Cada dato se toma de la primera fila del grupo que lo tenga: el
      // thumbnail puede venir en una fila y el video_id en otra
      const conThumbnail = lista.find((f) => f.thumbnailUrl) ?? lista[0];
      const videoId = lista.find((f) => f.videoId)?.videoId ?? "";
      return {
        anuncio,
        campana: conThumbnail.campana,
        adId: (lista.find((f) => f.adId) ?? lista[0]).adId,
        thumbnailUrl: conThumbnail.thumbnailUrl,
        videoId,
        videoUrl: urlVideo(videoId),
        funnel: sumarFunnels(lista.map((f) => f.funnel)),
      };
    })
    .sort((a, b) => b.funnel.leads - a.funnel.leads);
}

export interface NodoProyecto {
  proyecto: string;
  funnel: Funnel;
}

export interface NodoAnuncio {
  anuncio: string;
  funnel: Funnel;
  proyectos: NodoProyecto[];
}

export interface NodoConjunto {
  conjunto: string;
  funnel: Funnel;
  anuncios: NodoAnuncio[];
}

export interface NodoCampana {
  campana: string;
  funnel: Funnel;
  conjuntos: NodoConjunto[];
}

const porLeads = <T extends { funnel: Funnel }>(a: T, b: T) => b.funnel.leads - a.funnel.leads;

export function arbolFunnel(filas: FilaFunnel[]): NodoCampana[] {
  const porCampana = new Map<string, Map<string, Map<string, FilaFunnel[]>>>();

  for (const f of filas) {
    const conjuntos = porCampana.get(f.campana) ?? new Map<string, Map<string, FilaFunnel[]>>();
    porCampana.set(f.campana, conjuntos);
    const anuncios = conjuntos.get(f.conjunto) ?? new Map<string, FilaFunnel[]>();
    conjuntos.set(f.conjunto, anuncios);
    anuncios.set(f.anuncio, [...(anuncios.get(f.anuncio) ?? []), f]);
  }

  return [...porCampana.entries()]
    .map(([campana, conjuntos]) => {
      const nodosConjunto = [...conjuntos.entries()]
        .map(([conjunto, anuncios]) => {
          const nodosAnuncio = [...anuncios.entries()]
            .map(([anuncio, lista]) => {
              // Varias filas pueden normalizar al mismo proyecto (o a
              // "Sin proyecto"): se agrupan y suman para no repetir key
              const porProyecto = new Map<string, FilaFunnel[]>();
              for (const f of lista) {
                porProyecto.set(f.proyecto, [...(porProyecto.get(f.proyecto) ?? []), f]);
              }
              return {
                anuncio,
                funnel: sumarFunnels(lista.map((f) => f.funnel)),
                proyectos: [...porProyecto.entries()]
                  .map(([proyecto, filas]) => ({ proyecto, funnel: sumarFunnels(filas.map((f) => f.funnel)) }))
                  .sort(porLeads),
              };
            })
            .sort(porLeads);
          return {
            conjunto,
            funnel: sumarFunnels(nodosAnuncio.map((n) => n.funnel)),
            anuncios: nodosAnuncio,
          };
        })
        .sort(porLeads);
      return {
        campana,
        funnel: sumarFunnels(nodosConjunto.map((n) => n.funnel)),
        conjuntos: nodosConjunto,
      };
    })
    .sort(porLeads);
}
