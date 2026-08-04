import { CANALES_CON_ANUNCIOS } from "@/lib/canales";
import type {
  GastoGrupo,
  MetricasMeta,
  MontoPorMoneda,
  ResumenAnuncio,
  ResumenCampana,
  ResumenCanal,
  VentaAtribuida,
} from "@/types";

/**
 * Sperant no siempre registra el nivel de anuncio (utm_content llega vacío en
 * buena parte de las ventas), así que esas se juntan bajo una etiqueta
 * explícita en vez de descartarlas: los subtotales siguen sumando el total del
 * canal y queda visible cuánto no está trackeado.
 */
export const SIN_ANUNCIO = "Anuncio no identificado";
export const SIN_CAMPANA = "Sin campaña registrada";

/** Qué canal se usa para agrupar: de dónde vino la venta o quién la cerró. */
export type ModoAtribucion = "origen" | "cierre";

export function canalDe(v: VentaAtribuida, modo: ModoAtribucion): string {
  return modo === "cierre" ? v.canal_cierre : v.canal;
}

/* ---------- Montos ------------------------------------------------------- */
/**
 * Hay contratos en USD y en PEN y la data no trae tipo de cambio, así que
 * sumarlos daría un número que no significa nada. Se acumulan por moneda.
 */
export function sumarMontos(ventas: VentaAtribuida[]): MontoPorMoneda {
  const montos: MontoPorMoneda = {};
  for (const v of ventas) {
    const moneda = v.moneda || "USD";
    montos[moneda] = (montos[moneda] ?? 0) + v.precio_lista;
  }
  return montos;
}

/* ---------- Utilidades de agrupación ------------------------------------- */
function agruparPor<T>(items: T[], clave: (item: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of items) {
    const k = clave(item);
    const arr = mapa.get(k);
    if (arr) arr.push(item);
    else mapa.set(k, [item]);
  }
  return mapa;
}

const porTotal = <T extends { total: number }>(a: T, b: T) => b.total - a.total;

/* ---------- Gasto ---------------------------------------------------------*/
/**
 * Suma el gasto de un grupo recorriendo sus anuncios, no sus ventas. Un
 * anuncio que cerró tres ventas gastó una sola vez: sumando por venta el costo
 * saldría triplicado.
 */
function gastoDe(anuncios: ResumenAnuncio[], ventas: number): GastoGrupo | null {
  const conMetricas = anuncios.filter((a) => a.metricas);
  if (conMetricas.length === 0) return null;

  const gasto = conMetricas.reduce((s, a) => s + a.metricas!.gasto, 0);
  const leads = conMetricas.reduce((s, a) => s + a.metricas!.leads, 0);

  return {
    gasto: Math.round(gasto * 100) / 100,
    leads,
    cpl: leads > 0 ? Math.round((gasto / leads) * 100) / 100 : null,
    costoPorVenta: ventas > 0 ? Math.round((gasto / ventas) * 100) / 100 : null,
    anunciosConGasto: conMetricas.length,
  };
}

/* ---------- Nivel de anuncio --------------------------------------------- */
function anunciosDe(
  ventas: VentaAtribuida[],
  metricas?: MetricasMeta
): ResumenAnuncio[] {
  return [...agruparPor(ventas, (v) => v.utm_content || SIN_ANUNCIO).entries()]
    .map(([nombre, vs]) => {
      // Todas las ventas del grupo comparten nombre de anuncio, así que basta
      // el ad_id de la primera que lo haya resuelto.
      const ad_id = vs.find((v) => v.ad_id)?.ad_id ?? null;
      return {
        nombre,
        total: vs.length,
        montos: sumarMontos(vs),
        ad_id,
        ad_ambiguo: vs.some((v) => v.ad_ambiguo),
        otroProyecto: vs.filter((v) => v.utm_otro_proyecto).length,
        metricas: (ad_id && metricas?.porAnuncio[ad_id]) || null,
      };
    })
    .sort(porTotal);
}

/* ---------- Nivel de campaña --------------------------------------------- */
/**
 * El nivel de campaña solo existe donde hay UTMs. Antes, cuando faltaba
 * utm_campaign se usaba el medio como nombre de campaña, y en canales como
 * Referido o Gestión directa eso pintaba el medio disfrazado de campaña de
 * ads, que no existe en ninguna plataforma.
 *
 * Ahora: si ninguna venta del canal trae campaña, el canal no se expande. Si
 * unas sí y otras no, las que no van a un grupo aparte para que los subtotales
 * sigan cuadrando con el total del canal.
 */
/**
 * Nombre de campaña de una venta. Se prefiere el de Meta, resuelto desde el
 * ad_id, porque el utm_campaign de Sperant no corresponde a ninguna entidad de
 * la cuenta: "AON_SAP_Capi_Pachacamac_Terreno_Form_Clientes Potenciales_10SEP25"
 * no existe como campaña, conjunto ni anuncio, y la campaña real de ese anuncio
 * es "SAP_FORM_PACHACAMAC_VERDE_CAPI".
 */
function campanaDe(v: VentaAtribuida): string | null {
  return v.campana_meta || v.utm_campaign || null;
}

function campanasDe(
  ventas: VentaAtribuida[],
  metricas?: MetricasMeta
): ResumenCampana[] {
  const conCampana = ventas.filter((v) => campanaDe(v));
  if (conCampana.length === 0) return [];

  const sinCampana = ventas.filter((v) => !campanaDe(v));

  const grupos = [...agruparPor(conCampana, (v) => campanaDe(v)!).entries()];
  if (sinCampana.length) grupos.push([SIN_CAMPANA, sinCampana]);

  return grupos
    .map(([nombre, vs]) => {
      const anuncios = anunciosDe(vs, metricas);
      return {
        nombre,
        total: vs.length,
        montos: sumarMontos(vs),
        // El grupo es de Meta solo si su nombre salió de la cuenta publicitaria
        esCampanaMeta: vs.some((v) => v.campana_meta === nombre),
        gasto: gastoDe(anuncios, vs.length),
        anuncios,
      };
    })
    .sort(porTotal);
}

/* ---------- Agrupación principal ----------------------------------------- */
/**
 * Agrupa ventas en Canal > Campaña > Anuncio. Compartido entre el sync
 * (servidor) y los filtros del cliente para que ambos produzcan exactamente la
 * misma estructura.
 */
export function agruparPorCanal(
  ventas: VentaAtribuida[],
  modo: ModoAtribucion = "origen",
  metricas?: MetricasMeta
): ResumenCanal[] {
  return [...agruparPor(ventas, (v) => canalDe(v, modo)).entries()]
    .map(([canal, items]) => {
      // El desglose de campaña y anuncio solo se arma para canales de
      // anuncios. En WhatsApp, Referido o Gestión directa un UTM suelto del
      // historial del cliente hacía aparecer campañas de Meta colgando de ese
      // canal, como si el aviso hubiera generado la venta.
      const campanas = CANALES_CON_ANUNCIOS.has(canal)
        ? campanasDe(items, metricas)
        : [];
      return {
        canal,
        total: items.length,
        montos: sumarMontos(items),
        gasto: gastoDe(
          campanas.flatMap((c) => c.anuncios),
          items.length
        ),
        campanas,
      };
    })
    .sort(porTotal);
}
