import type { MetricasAnuncio, MetricasMeta } from "@/types";

/**
 * Gasto, leads y CPL por anuncio y por mes, desde el endpoint de insights.
 *
 * Va aparte de meta-ads.ts porque son dos llamadas con costos muy distintos:
 * el índice de nombres (/ads) es barato y cambia poco; insights es pesado,
 * tiene límite de peticiones por aplicación y cambia todos los días.
 *
 * **Por qué desglosado por mes.** La pantalla de ventas es mensual. Si se
 * pidiera el gasto acumulado del año y se dividiera entre las ventas de un mes,
 * el costo por venta saldría varias veces inflado: numerador de ocho meses,
 * denominador de uno. Con `time_increment=monthly` cada mes se compara contra
 * su propio gasto.
 *
 * Cuando Meta responde 403 "Application request limit reached" se devuelve lo
 * último que haya en cache, o vacío. La sincronización de ventas nunca se cae
 * por esto: el dato de Sperant es el crítico y el gasto es un extra.
 */

const META_API = "https://graph.facebook.com/v21.0";
const TOKEN = process.env.META_ACCESS_TOKEN || "";
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || "";

/** Las ventas cacheadas arrancan en enero, así que el gasto también. */
const DESDE = "2026-01-01";

// Insights cambia a diario pero no vale recalcularlo en cada sync de mes
const CACHE_MS = 6 * 60 * 60_000;

function configurado(): boolean {
  return Boolean(TOKEN && AD_ACCOUNT_ID);
}

const hoy = () => new Date().toISOString().slice(0, 10);

const sinDatos = (): MetricasAnuncio => ({
  gasto: 0,
  impresiones: 0,
  leads: 0,
  cpl: null,
});

const VACIO = (desde: string, hasta: string): MetricasMeta => ({
  porAnuncio: {},
  totalCuenta: sinDatos(),
  desde,
  hasta,
  completo: false,
});

interface FilaInsights {
  ad_id?: string;
  spend?: string;
  impressions?: string;
  actions?: { action_type: string; value: string }[];
  date_start?: string;
}

/**
 * Meta devuelve decenas de action_type por anuncio. "lead" es el agregado que
 * corresponde a la columna "Clientes potenciales" de Ads Manager; los
 * `offsite_*_add_meta_leads` son pasos intermedios del formulario y sumarlos
 * contaría el mismo lead varias veces.
 */
function leadsDe(fila: FilaInsights): number {
  const accion = (fila.actions ?? []).find((a) => a.action_type === "lead");
  return accion ? Number(accion.value) || 0 : 0;
}

const cpl = (gasto: number, leads: number): number | null =>
  leads > 0 ? Math.round((gasto / leads) * 100) / 100 : null;

const redondear = (v: number) => Math.round(v * 100) / 100;

function acumular(destino: MetricasAnuncio, fila: FilaInsights): MetricasAnuncio {
  const acum: MetricasAnuncio = {
    gasto: destino.gasto + (Number(fila.spend) || 0),
    impresiones: destino.impresiones + (Number(fila.impressions) || 0),
    leads: destino.leads + leadsDe(fila),
    cpl: null,
  };
  acum.cpl = cpl(acum.gasto, acum.leads);
  return acum;
}

/** mes (1-12) -> métricas de ese mes */
type PorMes = Map<number, { porAnuncio: Map<string, MetricasAnuncio>; total: MetricasAnuncio }>;

let cache: { porMes: PorMes; desde: string; hasta: string; ts: number } | null = null;

async function descargar(desde: string, hasta: string): Promise<PorMes> {
  const rango = encodeURIComponent(JSON.stringify({ since: desde, until: hasta }));
  let url =
    `${META_API}/act_${AD_ACCOUNT_ID}/insights` +
    `?level=ad&fields=ad_id,spend,impressions,actions` +
    `&time_increment=monthly&time_range=${rango}&limit=500` +
    `&access_token=${encodeURIComponent(TOKEN)}`;

  const porMes: PorMes = new Map();

  for (let pagina = 0; pagina < 60 && url; pagina++) {
    const res = await fetch(url);
    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      throw new Error(`Meta insights ${res.status}: ${detalle.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      data?: FilaInsights[];
      paging?: { next?: string };
    };

    for (const fila of json.data ?? []) {
      if (!fila.date_start) continue;
      const mes = Number(fila.date_start.slice(5, 7));
      if (!mes) continue;

      let bucket = porMes.get(mes);
      if (!bucket) {
        bucket = { porAnuncio: new Map(), total: sinDatos() };
        porMes.set(mes, bucket);
      }

      bucket.total = acumular(bucket.total, fila);
      if (!fila.ad_id) continue;
      bucket.porAnuncio.set(
        fila.ad_id,
        acumular(bucket.porAnuncio.get(fila.ad_id) ?? sinDatos(), fila)
      );
    }

    url = json.paging?.next ?? "";
  }

  return porMes;
}

function aMetricasMeta(
  porMes: PorMes,
  mes: number,
  desde: string,
  hasta: string,
  completo: boolean
): MetricasMeta {
  const bucket = porMes.get(mes);
  if (!bucket) return { ...VACIO(desde, hasta), completo };

  const porAnuncio: Record<string, MetricasAnuncio> = {};
  for (const [adId, m] of bucket.porAnuncio) {
    porAnuncio[adId] = { ...m, gasto: redondear(m.gasto) };
  }

  return {
    porAnuncio,
    totalCuenta: { ...bucket.total, gasto: redondear(bucket.total.gasto) },
    desde,
    hasta,
    completo,
  };
}

/**
 * Métricas del mes pedido. El rango declarado en `desde`/`hasta` es el del mes,
 * no el del año, para que la UI pueda mostrar contra qué período se compara.
 */
export async function obtenerMetricasMeta(mes: number): Promise<MetricasMeta> {
  const anio = new Date().getFullYear();
  const inicioMes = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const finMes = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
  // El mes en curso todavía no terminó: se corta hoy para no prometer un
  // período completo que aún no ocurrió.
  const finReal = finMes > hoy() ? hoy() : finMes;

  if (!configurado()) return VACIO(inicioMes, finReal);

  if (!cache || Date.now() - cache.ts >= CACHE_MS) {
    try {
      const porMes = await descargar(DESDE, hoy());
      cache = { porMes, desde: DESDE, hasta: hoy(), ts: Date.now() };
      const total = [...porMes.values()].reduce((s, b) => s + b.total.gasto, 0);
      console.log(
        `[meta] insights de ${porMes.size} meses, USD ${redondear(total)} desde ${DESDE}`
      );
    } catch (e) {
      console.error("[meta] No se pudo traer insights:", e);
      // Un cache viejo sirve más que nada; se marca incompleto igual
      return cache
        ? aMetricasMeta(cache.porMes, mes, inicioMes, finReal, false)
        : VACIO(inicioMes, finReal);
    }
  }

  return aMetricasMeta(cache.porMes, mes, inicioMes, finReal, true);
}
