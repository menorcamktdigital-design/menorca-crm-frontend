/**
 * Clasificación de canal a partir de los campos de medio/canal de Sperant.
 *
 * La tabla se construyó sobre los 47 valores distintos que devuelve
 * consultar_interacciones para los clientes con venta entre mayo y agosto 2026
 * (5,402 interacciones). El criterio es el equipo que genera el contacto, no el
 * soporte: "panel publicitario" y "volante" son la misma inversión de BTL
 * aunque uno sea vía pública y el otro mano a mano.
 *
 * El orden importa: se busca coincidencia exacta primero, porque hay valores
 * que se contienen entre sí ("referido web" no es "referido (c)", y
 * "gestión interna aliados" no es "gestión interna").
 */

export const CANALES = [
  "Meta Ads",
  "TikTok",
  "Google",
  "Web",
  "WhatsApp",
  "Referido",
  "Embajadoras",
  "Aliados inmobiliarios",
  "Activaciones",
  "Medios masivos",
  "Gestión directa",
  "Institucional",
  "Otro",
  "Sin atribuir",
] as const;

export type Canal = (typeof CANALES)[number];

/**
 * Canales donde una campaña y un anuncio significan algo. En los demás, un
 * cliente puede tener UTMs sueltos en su historial (por ejemplo vio un aviso
 * de Meta hace meses) pero la venta no entró por ahí, y mostrar ese anuncio
 * colgando de WhatsApp o Referido hace pensar que el aviso la generó.
 */
export const CANALES_CON_ANUNCIOS = new Set<string>([
  "Meta Ads",
  "TikTok",
  "Google",
  "Web",
]);

/** Valor de Sperant en minúsculas -> canal. Coincidencia exacta. */
const EXACTOS: Record<string, Canal> = {
  // Meta
  facebook: "Meta Ads",
  fblead: "Meta Ads",
  social: "Meta Ads",

  tiktok: "TikTok",

  // Google: el buscador y YouTube se compran por el mismo lado
  buscador: "Google",
  youtube: "Google",

  // Propiedades web de Menorca
  "pag.web.menorca": "Web",
  "página web y redes sociales de menorca": "Web",
  "pagina web": "Web",
  online: "Web",
  "orgánico online": "Web",
  organic: "Web",
  menorca_web: "Web",

  whatsapp: "WhatsApp",
  "whatsapp web": "WhatsApp",

  // Referidos
  "referido (c)": "Referido",
  "referido web": "Referido",
  referidos: "Referido",
  "referido ventana menorca": "Referido",
  "friends & family": "Referido",
  // Programa de recomendación de propietarios actuales
  "buen prop. puntual": "Referido",

  // Programa propio con incentivo, separado del referido espontáneo para poder
  // medir su costo aparte. Si se prefiere verlo junto, basta apuntarlo a
  // "Referido" acá.
  embajadoras: "Embajadoras",

  // Terceros que venden por comisión
  "ae inmobiliario": "Aliados inmobiliarios",
  "agente inmobiliario": "Aliados inmobiliarios",
  "ae de plaza": "Aliados inmobiliarios",
  "nexo inmobiliario": "Aliados inmobiliarios",
  "vitrina inmobiliaria": "Aliados inmobiliarios",
  "gestión interna aliados": "Aliados inmobiliarios",
  "coop.ahorrocred.sv": "Aliados inmobiliarios",

  // Presencia física: ferias, módulos, vía pública, volanteo
  "activaciones (ej. ferias, volanteo)": "Activaciones",
  "panel publicitario": "Activaciones",
  "feria virtual": "Activaciones",
  "centro comercial": "Activaciones",
  volante: "Activaciones",
  "otras activaciones": "Activaciones",
  "módulos en c.c": "Activaciones",
  "visita casetas": "Activaciones",
  "visita modulo": "Activaciones",
  "otras ferias": "Activaciones",
  "modulo mall del sur": "Activaciones",
  "menorca sobre ruedas (inactivo))": "Activaciones",
  // Personal de campo. No generó ninguna venta en 2026, así que la ubicación
  // está sin confirmar contra resultados: si resulta ser un tercero a comisión
  // va a "Aliados inmobiliarios".
  "promotor externo": "Activaciones",

  // Sin ventas en 2026 tampoco. Se separa de Activaciones porque es compra de
  // medios, no presencia física, y su costo se mide distinto.
  "medio televisivo": "Medios masivos",

  // Esfuerzo del propio equipo comercial
  "oficina de venta": "Gestión directa",
  "oficina de ventas": "Gestión directa",
  "visita oficinas": "Gestión directa",
  "gestión proactiva": "Gestión directa",
  "gestión interna": "Gestión directa",
  "gestión propia (inactivo)": "Gestión directa",
  sac: "Gestión directa",
  "cesión (sac)": "Gestión directa",
  telefonico: "Gestión directa",

  // Convenios y programas corporativos
  "institucional corporativo": "Institucional",
  "todo menorca vende": "Institucional",
};

/**
 * Fallback por subcadena, solo para valores nuevos que Sperant agregue después
 * de este mapeo. Se evalúa en orden y el primero que coincide gana.
 */
const PARCIALES: [string, Canal][] = [
  ["facebook", "Meta Ads"],
  ["instagram", "Meta Ads"],
  ["tiktok", "TikTok"],
  ["google", "Google"],
  ["youtube", "Google"],
  ["whatsapp", "WhatsApp"],
  ["pag.web", "Web"],
  ["página web", "Web"],
  ["menorca_web", "Web"],
  ["referido", "Referido"],
  ["inmobiliari", "Aliados inmobiliarios"],
  ["feria", "Activaciones"],
  ["volante", "Activaciones"],
  ["módulo", "Activaciones"],
  ["modulo", "Activaciones"],
  ["panel", "Activaciones"],
  ["centro comercial", "Activaciones"],
  ["televis", "Medios masivos"],
  ["radio", "Medios masivos"],
  ["oficina", "Gestión directa"],
  ["gestión", "Gestión directa"],
  ["institucional", "Institucional"],
];

/** Valores vistos que no cruzaron, para poder ampliar la tabla después. */
const desconocidos = new Set<string>();

export function mediosSinClasificar(): string[] {
  return [...desconocidos];
}

export function clasificarCanal(medio: string | null | undefined): Canal {
  if (!medio) return "Sin atribuir";

  const m = medio.trim().toLowerCase().replace(/\s+/g, " ");
  if (!m) return "Sin atribuir";

  const exacto = EXACTOS[m];
  if (exacto) return exacto;

  for (const [fragmento, canal] of PARCIALES) {
    if (m.includes(fragmento)) return canal;
  }

  desconocidos.add(m);
  return "Otro";
}
