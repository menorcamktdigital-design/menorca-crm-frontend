/**
 * Resolución de ad_id de Meta a partir del nombre del anuncio.
 *
 * Sperant guarda el anuncio solo como texto en utm_content, sin ad_id. Para
 * poder enlazar a Ads Manager hay que cruzar ese nombre contra los anuncios
 * reales de la cuenta.
 *
 * Requiere META_ACCESS_TOKEN (System User token del Business Manager) y
 * META_AD_ACCOUNT_ID. Sin token la resolución se desactiva y las ventas
 * quedan con ad_id null: la UI cae al link de búsqueda por nombre.
 */

const META_API = "https://graph.facebook.com/v21.0";
const TOKEN = process.env.META_ACCESS_TOKEN || "";
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || "";
const CACHE_MS = 6 * 60 * 60_000; // el inventario de anuncios cambia poco

export function metaConfigurado(): boolean {
  return Boolean(TOKEN && AD_ACCOUNT_ID);
}

/**
 * Los nombres no coinciden literal entre Sperant y Meta: difieren en
 * mayúsculas, espacios repetidos y el sufijo " - Copia" que Meta agrega al
 * duplicar un anuncio. Se normaliza para que el cruce no falle por eso.
 */
function normalizar(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .replace(/\s*-\s*copia\s*$/, "")
    .replace(/\s+/g, " ");
}

/**
 * Lo que se sabe de un anuncio de Meta a partir de su nombre.
 *
 * `campana` es el nombre real de la campaña en Meta. Hace falta porque el
 * utm_campaign que guarda Sperant no corresponde a ninguna entidad de la
 * cuenta: por ejemplo "AON_SAP_Capi_Pachacamac_Terreno_Form_Clientes
 * Potenciales_10SEP25" no existe como campaña, conjunto ni anuncio, mientras
 * que la campaña real de ese anuncio es "SAP_FORM_PACHACAMAC_VERDE_CAPI".
 */
export interface AnuncioMeta {
  ad_id: string;
  campana: string | null;
  /**
   * true cuando hay más de un anuncio con el mismo nombre normalizado. El
   * cruce es por nombre, no por ID, y 932 de los 2,371 nombres de la cuenta
   * apuntan a más de un anuncio (3,170 de 4,609 anuncios, hasta 11 con el
   * mismo nombre). En esos casos el ad_id elegido puede no ser el correcto.
   */
  ambiguo: boolean;
}

let cache: { mapa: Map<string, AnuncioMeta>; ts: number } | null = null;

/** Descarga todos los anuncios de la cuenta paginando el edge /ads. */
async function descargarAnuncios(): Promise<Map<string, AnuncioMeta>> {
  const mapa = new Map<string, AnuncioMeta>();
  let url =
    `${META_API}/act_${AD_ACCOUNT_ID}/ads` +
    `?fields=id,name,campaign{id,name}&limit=500` +
    `&access_token=${encodeURIComponent(TOKEN)}`;

  // La cuenta puede tener miles de anuncios; el tope evita un bucle infinito
  // si la API devolviera un cursor que no avanza.
  for (let pagina = 0; pagina < 40 && url; pagina++) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta respondió ${res.status} al listar anuncios`);
    }
    const json = (await res.json()) as {
      data?: { id: string; name: string; campaign?: { id: string; name: string } }[];
      paging?: { next?: string };
    };

    for (const ad of json.data ?? []) {
      if (!ad.name) continue;
      const clave = normalizar(ad.name);
      const previo = mapa.get(clave);
      if (previo) {
        // Ante duplicados se conserva el primero, pero queda marcado para que
        // la UI no presente el link como si fuera exacto.
        previo.ambiguo = true;
        continue;
      }
      mapa.set(clave, {
        ad_id: ad.id,
        campana: ad.campaign?.name ?? null,
        ambiguo: false,
      });
    }

    url = json.paging?.next ?? "";
  }

  return mapa;
}

/**
 * Devuelve el índice nombre-normalizado -> ad_id, cacheado en memoria.
 * Si Meta falla, se devuelve un mapa vacío: el sync continúa sin ad_id en
 * lugar de romperse, porque el dato de ventas es lo crítico.
 */
export async function obtenerMapaAnuncios(): Promise<Map<string, AnuncioMeta>> {
  if (!metaConfigurado()) return new Map();

  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.mapa;

  try {
    const mapa = await descargarAnuncios();
    cache = { mapa, ts: Date.now() };
    const ambiguos = [...mapa.values()].filter((a) => a.ambiguo).length;
    console.log(
      `[meta] ${mapa.size} nombres de anuncio indexados, ${ambiguos} ambiguos`
    );
    return mapa;
  } catch (e) {
    console.error("[meta] No se pudo indexar anuncios:", e);
    return cache?.mapa ?? new Map();
  }
}

/** Busca el anuncio de Meta por su nombre. null si no cruza. */
export function resolverAnuncio(
  nombreAnuncio: string | null,
  mapa: Map<string, AnuncioMeta>
): AnuncioMeta | null {
  if (!nombreAnuncio) return null;
  return mapa.get(normalizar(nombreAnuncio)) ?? null;
}
