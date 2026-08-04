import { query } from "@/lib/db";
import { obtenerMapaAnuncios, resolverAnuncio } from "@/lib/meta-ads";
import { obtenerMetricasMeta } from "@/lib/meta-insights";
import { agruparPorCanal } from "@/lib/ventas-agrupar";
import {
  CANALES_CON_ANUNCIOS,
  clasificarCanal,
  mediosSinClasificar,
} from "@/lib/canales";
import type { VentaAtribuida } from "@/types";

const SPERANT = "https://apirest.menorca.services/api";
const CONCURRENCY = 15;
const TABLA = "ventas_historico_cache";
const REFRESH_MS = 24 * 60 * 60_000; // 1 vez al día para mes actual

/**
 * Versión de la forma del JSON cacheado. Subirla invalida lo guardado: un mes
 * con versión vieja se vuelve a sincronizar en cuanto alguien lo abre, en vez
 * de pintar campos que ya no existen.
 * 2 = atribución por codigo_proforma, canal de origen y de cierre separados.
 * 3 = el origen se acota a las interacciones del proyecto que se vendió.
 * 4 = campaña real de Meta resuelta desde el ad_id.
 * 5 = los UTM se buscan fuera del proyecto cuando no hay dentro.
 * 6 = gasto, leads y CPL de Meta por anuncio.
 * 7 = el gasto se pide del mes de la venta, no del año acumulado.
 * 8 = campaña y anuncio solo en canales de anuncios.
 */
const VERSION = 8;

/* ---------- Estado en memoria (evita syncs duplicados) ------------------- */
const syncing = new Set<number>();
let tablaCreada = false;

async function asegurarTabla() {
  if (tablaCreada) return;
  await query(`
    CREATE TABLE IF NOT EXISTS ${TABLA} (
      mes INT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tablaCreada = true;
}

/* ---------- Mapeo de proyectos ------------------------------------------- */
const PROYECTOS_MAP: Record<number, string> = {
  12: "La Quebrada",
  30: "San Antonio de Pachacamac",
  33: "Praderas El Olivar",
  34: "Praderas El Olivar 2",
  36: "Alto Piura",
  38: "Villas de San Antonio Chorrillos",
  41: "Caleta San Antonio",
  42: "El Olivar de Pisco",
  44: "San Antonio de Mala",
  51: "San Antonio de Chiclayo",
  52: "Posada del Sol Chiclayo",
  53: "Villa Posada del Sol Chiclayo",
  56: "Costa Linda",
  57: "Lirios de Carabayllo",
  58: "Villas Punta Mar Lotes",
  60: "San Antonio de Pachacamac",
  61: "San Antonio de Pachacamac 2",
  62: "Mala Comercio",
  63: "Los Pecanos",
  64: "Villas Punta Mar Casas",
  65: "Las Rompientes",
  68: "San Antonio de Chiclayo 3",
  69: "Villas de San Antonio Chorrillos",
  70: "El Carbón",
  71: "Praderas El Olivar 3",
  72: "Mirador de San Antonio",
  73: "Brisas de Ventanilla",
};

/* ---------- Tipos -------------------------------------------------------- */
interface InteraccionRaw {
  id: number;
  tipo_interaccion: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  canal_entrada: string | null;
  medio_captacion: string | null;
  canal_entrada_rastro: string | null;
  medio_captacion_rastro: string | null;
  codigo_proforma: string | null;
  fecha_creacion: string;
  codigo_proyecto: string | null;
  nombre_proyecto: string | null;
}

/**
 * Sperant reparte el mismo dato entre cuatro campos y ninguno está siempre
 * lleno. Los `_rastro` son los que Sperant arrastra desde el registro del
 * cliente, así que rellenan cuando la interacción puntual viene vacía.
 */
function medioDe(i: InteraccionRaw): string | null {
  return (
    i.medio_captacion ||
    i.medio_captacion_rastro ||
    i.canal_entrada ||
    i.canal_entrada_rastro ||
    null
  );
}

const tiempo = (iso: string) => new Date(iso).getTime();

/* ---------- Atribución --------------------------------------------------- */
/**
 * Cada venta trae `codigo_proforma` y existe exactamente una interacción
 * ("creación de proforma") con ese mismo código: es la llave 1:1 entre la venta
 * y el momento en que se cerró. Medido sobre junio 2026, 132 de 135 ventas
 * cruzan y ninguna cruza con más de una.
 *
 * Eso permite responder dos preguntas distintas, que antes se mezclaban en un
 * solo campo:
 *
 *   origen  -> primera interacción del cliente hasta la fecha de esa proforma.
 *              De dónde vino. Es lo que hay que mirar para repartir presupuesto.
 *   cierre  -> el medio registrado en la interacción de la proforma.
 *              Quién lo cerró. En junio difiere del origen en 54 de 135 ventas.
 *
 * La regla anterior ("si existe una interacción de facebook con utm_campaign,
 * la venta es de Meta") no era ninguna de las dos: tomaba interacciones
 * posteriores al origen, incluso años después, y le asignaba a Meta ventas que
 * habían entrado por TikTok, referido o gestión directa.
 */
interface Atribucion {
  canal: string;
  medio: string | null;
  fecha_origen: string | null;

  canal_cierre: string;
  medio_cierre: string | null;
  fecha_proforma: string | null;
  dias_ciclo: number | null;

  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  /** false cuando los UTM salen de una interacción posterior a la primera. */
  utm_del_origen: boolean;
  /** true cuando el anuncio corresponde a un proyecto distinto al vendido. */
  utm_otro_proyecto: boolean;
}

const SIN_ATRIBUCION: Atribucion = {
  canal: "Sin atribuir",
  medio: null,
  fecha_origen: null,
  canal_cierre: "Sin cruce",
  medio_cierre: null,
  fecha_proforma: null,
  dias_ciclo: null,
  utm_source: null,
  utm_campaign: null,
  utm_content: null,
  utm_del_origen: false,
  utm_otro_proyecto: false,
};

function determinarAtribucion(
  interacciones: InteraccionRaw[],
  codigoProforma: string,
  fechaCierre: string,
  codigoProyecto: number
): Atribucion {
  if (!interacciones.length) return SIN_ATRIBUCION;

  const orden = [...interacciones].sort(
    (a, b) => tiempo(a.fecha_creacion) - tiempo(b.fecha_creacion)
  );

  const proforma = codigoProforma
    ? orden.find((i) => i.codigo_proforma && i.codigo_proforma === codigoProforma)
    : undefined;

  // Sin proforma cruzada se usa la fecha de cierre como tope. Es peor corte
  // (la proforma se crea antes del cierre) pero evita contar como origen algo
  // que pasó después de la venta.
  const tope = proforma ? tiempo(proforma.fecha_creacion) : tiempo(fechaCierre);
  const previas = orden.filter((i) => tiempo(i.fecha_creacion) <= tope);

  // Si el corte deja todo fuera (fechas inconsistentes en Sperant) se cae a la
  // línea completa en vez de devolver "sin atribuir".
  const ventana = previas.length ? previas : orden;

  // El origen se acota al proyecto que se vendió. Un cliente que ya compró
  // antes arrastra interacciones de hace años que no tienen nada que ver con
  // esta compra: tomando su primera interacción histórica, 29 de las 135
  // ventas de junio 2026 quedaban atribuidas a un contacto de más de 2 años de
  // antigüedad (hasta 12 años). Acotando al proyecto bajan a 11 y la mediana
  // del ciclo pasa de 15 a 7 días, sin perder ni una venta: las 133 que cruzan
  // proforma tienen al menos una interacción de su propio proyecto.
  const delProyecto = ventana.filter(
    (i) => Number(i.codigo_proyecto) === codigoProyecto
  );
  const ventanaOrigen = delProyecto.length ? delProyecto : ventana;

  const origen = ventanaOrigen.find((i) => medioDe(i)) ?? ventanaOrigen[0];
  const medio = medioDe(origen);
  const canal = clasificarCanal(medio);

  // Los UTM se buscan más allá del proyecto, al revés que el canal.
  //
  // Un cliente entra por un anuncio de un proyecto y termina comprando otro:
  // el anuncio igual fue el que lo trajo, así que esconderlo pierde
  // información real. De las 154 ventas con origen Meta que quedaban sin
  // campaña ni anuncio, 52 tenían UTM de otro proyecto y 5 del mismo proyecto
  // pero fuera del corte temporal. Las otras 97 no tienen UTM en ninguna
  // interacción: ahí Sperant sencillamente no registró nada.
  //
  // El canal sí se queda acotado al proyecto, porque para repartir presupuesto
  // importa qué trajo esta compra, no la anterior.
  const tieneUtm = (i: InteraccionRaw) =>
    Boolean(i.utm_campaign || i.utm_content || i.utm_source);

  // La búsqueda fuera del proyecto solo aplica si la venta entró por un canal
  // de anuncios. Un cliente que entró por WhatsApp puede tener un utm_content
  // de Meta suelto en su historial de hace meses; colgarle ese anuncio hacía
  // aparecer campañas y avisos de Meta debajo del canal WhatsApp, como si el
  // aviso hubiera generado esa venta.
  const conUtm = CANALES_CON_ANUNCIOS.has(canal)
    ? (ventanaOrigen.find(tieneUtm) ?? ventana.find(tieneUtm) ?? orden.find(tieneUtm))
    : ventanaOrigen.find(tieneUtm);

  const fechaProforma = proforma?.fecha_creacion ?? null;
  const diasCiclo =
    fechaProforma && origen
      ? Math.max(
          0,
          Math.round(
            (tiempo(fechaProforma) - tiempo(origen.fecha_creacion)) / 86_400_000
          )
        )
      : null;

  return {
    canal,
    medio,
    fecha_origen: origen?.fecha_creacion ?? null,

    canal_cierre: proforma ? clasificarCanal(medioDe(proforma)) : "Sin cruce",
    medio_cierre: proforma ? medioDe(proforma) : null,
    fecha_proforma: fechaProforma,
    dias_ciclo: diasCiclo,

    utm_source: conUtm?.utm_source ?? null,
    utm_campaign: conUtm?.utm_campaign ?? null,
    utm_content: conUtm?.utm_content ?? null,
    utm_del_origen: conUtm !== undefined && conUtm === origen,
    utm_otro_proyecto: conUtm !== undefined && !ventanaOrigen.includes(conUtm),
  };
}

/* ---------- Normalización de nombres de proyecto ------------------------- */
/**
 * Sperant escribe el mismo proyecto con distinta capitalización ("San Antonio
 * De Pachacamac 2" y "San Antonio de Pachacamac 2"), lo que partía el filtro
 * en dos entradas. Se unifica a formato Título con preposiciones en minúscula.
 */
const PREPOSICIONES = new Set(["de", "del", "y"]);

function normalizarNombre(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  let esPrimera = true;
  return limpio.toLowerCase().replace(/\p{L}[\p{L}\p{M}]*/gu, (palabra) => {
    const primera = esPrimera;
    esPrimera = false;
    if (!primera && PREPOSICIONES.has(palabra)) return palabra;
    return palabra[0].toUpperCase() + palabra.slice(1);
  });
}

/* ---------- Nombre de proyecto desde las interacciones ------------------- */
/**
 * Sperant no devuelve nombre_proyecto en consultar_ventas_mes, pero sí en
 * consultar_interacciones. Un cliente puede tener interacciones de varios
 * proyectos, así que se busca por codigo_proyecto de la venta (que coincide
 * con el de la interacción) y no por la primera que aparezca.
 */
function resolverNombreProyecto(
  codigoProyecto: number,
  interacciones: InteraccionRaw[]
): string {
  const match = interacciones.find(
    (i) => Number(i.codigo_proyecto) === codigoProyecto && i.nombre_proyecto
  );
  if (match?.nombre_proyecto) return normalizarNombre(match.nombre_proyecto);
  return PROYECTOS_MAP[codigoProyecto] || `Proyecto ${codigoProyecto}`;
}

/* ---------- Fetch interacciones ------------------------------------------ */
async function fetchInteraccionesBatch(
  dnis: string[]
): Promise<Map<string, InteraccionRaw[]>> {
  const mapa = new Map<string, InteraccionRaw[]>();
  for (let i = 0; i < dnis.length; i += CONCURRENCY) {
    const batch = dnis.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((dni) =>
        fetch(`${SPERANT}/consultar_interacciones?dni=${dni}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    );
    batch.forEach((dni, idx) =>
      mapa.set(dni, Array.isArray(results[idx]) ? results[idx] : [])
    );
  }
  return mapa;
}

/**
 * El lead puede haber entrado con el DNI del cónyuge y la venta figurar a
 * nombre del otro: 25 de las 135 ventas de junio tienen copropietario. Si solo
 * se mira al titular, esas quedan sin origen.
 */
function dnisDeVenta(v: Record<string, unknown>): string[] {
  const titular = String(v.documento_cliente_titular ?? "").trim();
  const copro = String(v.documento_copropietarios ?? "")
    .split(/[,;/\s]+/)
    .map((d) => d.trim())
    .filter(Boolean);
  return [...new Set([titular, ...copro].filter((d) => d.length > 0))];
}

/* ---------- Procesar un mes desde Sperant -------------------------------- */
export async function procesarMes(mes: number) {
  const ventasRes = await fetch(`${SPERANT}/consultar_ventas_mes?mes=${mes}`);
  if (!ventasRes.ok) throw new Error(`Sperant ${ventasRes.status} para mes=${mes}`);

  const ventasRaw: Record<string, unknown>[] = await ventasRes.json();

  const dnis = [...new Set(ventasRaw.flatMap(dnisDeVenta))];

  const [interacciones, mapaAnuncios, metricasMeta] = await Promise.all([
    fetchInteraccionesBatch(dnis),
    obtenerMapaAnuncios(),
    obtenerMetricasMeta(mes),
  ]);

  const ventas: VentaAtribuida[] = ventasRaw.map((v) => {
    // Las interacciones del titular y las del copropietario son la misma
    // historia comercial; se unen y se deduplican por id.
    const porId = new Map<number, InteraccionRaw>();
    for (const dni of dnisDeVenta(v)) {
      for (const i of interacciones.get(dni) ?? []) porId.set(i.id, i);
    }
    const ints = [...porId.values()];

    const codProy = Number(v.codigo_proyecto) || 0;
    const codigoProforma = String(v.codigo_proforma ?? "");
    const fechaCierre = String(v.fecha_cierre ?? "");
    const atrib = determinarAtribucion(ints, codigoProforma, fechaCierre, codProy);
    const anuncio = resolverAnuncio(atrib.utm_content, mapaAnuncios);

    return {
      documento: String(v.documento_cliente_titular ?? ""),
      codigo_proforma: codigoProforma,
      codigo_proyecto: codProy,
      nombre_proyecto: resolverNombreProyecto(codProy, ints),
      codigo_unidad: String(v.codigo_unidad ?? ""),
      tipo_unidad: String(v.tipo_unidad_principal ?? ""),
      precio_lista: Number(v.precio_lista) || 0,
      moneda: String(v.moneda_contrato ?? "USD"),
      fecha_cierre: fechaCierre,
      estado_contrato: String(v.estado_contrato ?? ""),
      vendedor: String(v.usuario_vendedor ?? ""),
      ...atrib,
      ad_id: anuncio?.ad_id ?? null,
      ad_ambiguo: anuncio?.ambiguo ?? false,
      campana_meta: anuncio?.campana ?? null,
    };
  });

  const sinClasificar = mediosSinClasificar();
  if (sinClasificar.length) {
    console.warn(`[sync] medios sin clasificar: ${sinClasificar.join(", ")}`);
  }

  return {
    version: VERSION,
    mes,
    total: ventas.length,
    por_canal: agruparPorCanal(ventas, "origen", metricasMeta),
    ventas,
    metricas_meta: metricasMeta,
  };
}

/* ---------- Guardar en BD ------------------------------------------------ */
export async function guardarCache(mes: number, data: unknown) {
  await asegurarTabla();
  await query(
    `INSERT INTO ${TABLA} (mes, data, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (mes) DO UPDATE SET data = $2, created_at = NOW()`,
    [mes, JSON.stringify(data)]
  );
}

/* ---------- Sync de un mes (background, no duplica) ---------------------- */
// Último error por mes, para poder diagnosticar desde el endpoint de estado:
// syncMesBackground es fire-and-forget y su error solo iría a los logs.
const ultimoError = new Map<number, string>();

export function syncMesBackground(mes: number) {
  if (syncing.has(mes)) return;
  syncing.add(mes);
  ultimoError.delete(mes);

  procesarMes(mes)
    .then((data) => guardarCache(mes, data))
    .then(() => console.log(`[sync] mes ${mes} OK`))
    .catch((e) => {
      const msg = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
      ultimoError.set(mes, msg);
      console.error(`[sync] mes ${mes} ERROR:`, e);
    })
    .finally(() => syncing.delete(mes));
}

/* ---------- Estado de sincronización en curso ---------------------------- */
export function mesesSincronizando(): number[] {
  return [...syncing];
}

export function erroresSync(): Record<number, string> {
  return Object.fromEntries(ultimoError);
}

/* ---------- Verificar y sincronizar meses faltantes ---------------------- */
let initDone = false;

export async function inicializarSync() {
  if (initDone) return;
  initDone = true;

  try {
    await asegurarTabla();

    const mesActual = new Date().getMonth() + 1;

    const rows = await query<{ mes: number; data: { version?: number }; created_at: Date }>(
      `SELECT mes, data, created_at FROM ${TABLA}`
    );
    const cached = new Map(
      rows.map((r) => [r.mes, { fecha: new Date(r.created_at), version: r.data?.version ?? 1 }])
    );

    // Meses pasados sin cache, o cacheados con una forma vieja del JSON
    for (let m = 1; m < mesActual; m++) {
      const c = cached.get(m);
      if (!c || c.version !== VERSION) syncMesBackground(m);
    }

    // Mes actual: sync si no existe, si cambió la forma, o si tiene más de 24h
    const actual = cached.get(mesActual);
    if (
      !actual ||
      actual.version !== VERSION ||
      Date.now() - actual.fecha.getTime() > REFRESH_MS
    ) {
      syncMesBackground(mesActual);
    }
  } catch (e) {
    console.error("[sync] Error inicializando:", e);
    initDone = false;
  }
}

/* ---------- Leer de BD --------------------------------------------------- */
export async function leerCacheMes(mes: number) {
  await asegurarTabla();
  const rows = await query<{
    data: { version?: number; metricas_meta?: { completo?: boolean } };
    created_at: Date;
  }>(`SELECT data, created_at FROM ${TABLA} WHERE mes = $1`, [mes]);
  if (rows.length === 0) return null;

  const data = rows[0].data;

  // Forma vieja del JSON: se descarta y se pide de nuevo, porque a la UI le
  // faltarían canal_cierre, moneda y tipo_unidad.
  if ((data?.version ?? 1) !== VERSION) {
    syncMesBackground(mes);
    return null;
  }

  // Meta falló durante el sync (típicamente por límite de peticiones) y el mes
  // quedó guardado sin gasto. Se devuelve igual, porque las ventas sí están,
  // pero se reintenta en segundo plano para que no se congele en cero.
  if (data?.metricas_meta && data.metricas_meta.completo === false) {
    syncMesBackground(mes);
    return data;
  }

  // Si es mes actual y tiene más de 24h, refrescar en background
  const mesActual = new Date().getMonth() + 1;
  if (mes === mesActual) {
    const age = Date.now() - new Date(rows[0].created_at).getTime();
    if (age > REFRESH_MS) {
      syncMesBackground(mes);
    }
  }

  return data;
}
