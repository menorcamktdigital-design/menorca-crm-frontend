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

let cache: { mapa: Map<string, string>; ts: number } | null = null;

/** Descarga todos los anuncios de la cuenta paginando el edge /ads. */
async function descargarAnuncios(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  let url =
    `${META_API}/act_${AD_ACCOUNT_ID}/ads` +
    `?fields=id,name&limit=500&access_token=${encodeURIComponent(TOKEN)}`;

  // La cuenta puede tener miles de anuncios; el tope evita un bucle infinito
  // si la API devolviera un cursor que no avanza.
  for (let pagina = 0; pagina < 40 && url; pagina++) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta respondió ${res.status} al listar anuncios`);
    }
    const json = (await res.json()) as {
      data?: { id: string; name: string }[];
      paging?: { next?: string };
    };

    for (const ad of json.data ?? []) {
      if (!ad.name) continue;
      const clave = normalizar(ad.name);
      // Ante duplicados por " - Copia" se conserva el primero.
      if (!mapa.has(clave)) mapa.set(clave, ad.id);
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
export async function obtenerMapaAnuncios(): Promise<Map<string, string>> {
  if (!metaConfigurado()) return new Map();

  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.mapa;

  try {
    const mapa = await descargarAnuncios();
    cache = { mapa, ts: Date.now() };
    console.log(`[meta] ${mapa.size} anuncios indexados`);
    return mapa;
  } catch (e) {
    console.error("[meta] No se pudo indexar anuncios:", e);
    return cache?.mapa ?? new Map();
  }
}

/** Busca el ad_id de un nombre de anuncio. null si no cruza. */
export function resolverAdId(
  nombreAnuncio: string | null,
  mapa: Map<string, string>
): string | null {
  if (!nombreAnuncio) return null;
  return mapa.get(normalizar(nombreAnuncio)) ?? null;
}
