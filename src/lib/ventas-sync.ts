import { query } from "@/lib/db";

const SPERANT = "https://apirest.menorca.services/api";
const CONCURRENCY = 15;
const TABLA = "ventas_historico_cache";
const REFRESH_MS = 24 * 60 * 60_000; // 1 vez al día para mes actual

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

/* ---------- Clasificación de canal --------------------------------------- */
function clasificarCanal(medio: string): string {
  const m = medio.toLowerCase();
  if (m.includes("facebook") || m === "fblead" || m === "social") return "Meta Ads";
  if (m.includes("tiktok")) return "TikTok";
  if (m.includes("whatsapp")) return "WhatsApp";
  if (m.includes("pag.web") || m.includes("menorca_web") || m === "organic") return "Web";
  if (m.includes("referido")) return "Referido";
  if (
    m.includes("oficina") ||
    m.includes("proactiva") ||
    m.includes("gestión") ||
    m.includes("centro comercial") ||
    m.includes("agente inmobiliario")
  )
    return "Gestión directa";
  if (m.includes("google")) return "Google";
  return "Otro";
}

/* ---------- Tipos -------------------------------------------------------- */
interface InteraccionRaw {
  tipo_interaccion: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  canal_entrada: string | null;
  medio_captacion: string | null;
  canal_entrada_rastro: string | null;
  medio_captacion_rastro: string | null;
  fecha_creacion: string;
}

interface Atribucion {
  canal: string;
  medio: string;
  utm_source: string | null;
  utm_campaign: string | null;
}

/* ---------- Atribución (first touch) ------------------------------------- */
function determinarAtribucion(interacciones: InteraccionRaw[]): Atribucion {
  if (!interacciones.length)
    return { canal: "Sin atribuir", medio: "sin datos", utm_source: null, utm_campaign: null };

  const sorted = [...interacciones].sort(
    (a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
  );

  const fbConCampana = sorted.find(
    (i) => i.tipo_interaccion === "facebook" && i.utm_campaign
  );
  if (fbConCampana) {
    return {
      canal: "Meta Ads",
      medio: "facebook",
      utm_source: fbConCampana.utm_source,
      utm_campaign: fbConCampana.utm_campaign,
    };
  }

  const creacion = sorted.find((i) => i.tipo_interaccion === "creación de cliente");
  if (creacion) {
    const medio =
      creacion.medio_captacion ||
      creacion.medio_captacion_rastro ||
      creacion.canal_entrada ||
      creacion.canal_entrada_rastro;
    if (medio) {
      return {
        canal: clasificarCanal(medio),
        medio,
        utm_source: creacion.utm_source,
        utm_campaign: creacion.utm_campaign,
      };
    }
  }

  const conUtm = sorted.find((i) => i.utm_source);
  if (conUtm) {
    const medio = conUtm.utm_medium || conUtm.medio_captacion || conUtm.utm_source!;
    return {
      canal: clasificarCanal(medio),
      medio,
      utm_source: conUtm.utm_source,
      utm_campaign: conUtm.utm_campaign,
    };
  }

  const conMedio = sorted.find(
    (i) => i.medio_captacion || i.medio_captacion_rastro || i.canal_entrada_rastro
  );
  if (conMedio) {
    const medio =
      conMedio.medio_captacion || conMedio.medio_captacion_rastro || conMedio.canal_entrada_rastro!;
    return { canal: clasificarCanal(medio), medio, utm_source: null, utm_campaign: null };
  }

  return { canal: "Sin atribuir", medio: "sin datos", utm_source: null, utm_campaign: null };
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
    batch.forEach((dni, idx) => mapa.set(dni, results[idx] ?? []));
  }
  return mapa;
}

/* ---------- Procesar un mes desde Sperant -------------------------------- */
async function procesarMes(mes: number) {
  const ventasRes = await fetch(`${SPERANT}/consultar_ventas_mes?mes=${mes}`);
  if (!ventasRes.ok) throw new Error(`Sperant ${ventasRes.status} para mes=${mes}`);

  const ventasRaw: Record<string, unknown>[] = await ventasRes.json();

  const dnis = [
    ...new Set(
      ventasRaw
        .map((v) => String(v.documento_cliente_titular ?? ""))
        .filter((d) => d.length > 0)
    ),
  ];

  const interacciones = await fetchInteraccionesBatch(dnis);

  const ventas = ventasRaw.map((v) => {
    const dni = String(v.documento_cliente_titular ?? "");
    const atrib = determinarAtribucion(interacciones.get(dni) ?? []);
    const codProy = Number(v.codigo_proyecto) || 0;
    return {
      documento: dni,
      codigo_proyecto: codProy,
      nombre_proyecto: PROYECTOS_MAP[codProy] || `Proyecto ${codProy}`,
      codigo_unidad: String(v.codigo_unidad ?? ""),
      precio_lista: Number(v.precio_lista) || 0,
      fecha_cierre: String(v.fecha_cierre ?? ""),
      estado_contrato: String(v.estado_contrato ?? ""),
      vendedor: String(v.usuario_vendedor ?? ""),
      ...atrib,
    };
  });

  const grupoCanal = new Map<string, typeof ventas>();
  for (const v of ventas) {
    const arr = grupoCanal.get(v.canal) ?? [];
    arr.push(v);
    grupoCanal.set(v.canal, arr);
  }

  const por_canal = [...grupoCanal.entries()]
    .map(([canal, items]) => {
      const campMap = new Map<string, number>();
      for (const v of items) {
        const key = v.utm_campaign || v.medio;
        campMap.set(key, (campMap.get(key) ?? 0) + 1);
      }
      const campanas = [...campMap.entries()]
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);
      return { canal, total: items.length, campanas };
    })
    .sort((a, b) => b.total - a.total);

  return { mes, total: ventas.length, por_canal, ventas };
}

/* ---------- Guardar en BD ------------------------------------------------ */
async function guardarCache(mes: number, data: unknown) {
  await query(
    `INSERT INTO ${TABLA} (mes, data, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (mes) DO UPDATE SET data = $2, created_at = NOW()`,
    [mes, JSON.stringify(data)]
  );
}

/* ---------- Sync de un mes (background, no duplica) ---------------------- */
export function syncMesBackground(mes: number) {
  if (syncing.has(mes)) return;
  syncing.add(mes);

  procesarMes(mes)
    .then((data) => guardarCache(mes, data))
    .then(() => console.log(`[sync] mes ${mes} OK`))
    .catch((e) => console.error(`[sync] mes ${mes} ERROR:`, e))
    .finally(() => syncing.delete(mes));
}

/* ---------- Verificar y sincronizar meses faltantes ---------------------- */
let initDone = false;

export async function inicializarSync() {
  if (initDone) return;
  initDone = true;

  try {
    await asegurarTabla();

    const mesActual = new Date().getMonth() + 1;

    const rows = await query<{ mes: number; created_at: Date }>(
      `SELECT mes, created_at FROM ${TABLA}`
    );
    const cached = new Map(rows.map((r) => [r.mes, new Date(r.created_at)]));

    // Meses pasados sin cache → sincronizar
    for (let m = 1; m < mesActual; m++) {
      if (!cached.has(m)) {
        syncMesBackground(m);
      }
    }

    // Mes actual: sync si no existe o si tiene más de 24h
    const cachedActual = cached.get(mesActual);
    if (!cachedActual || Date.now() - cachedActual.getTime() > REFRESH_MS) {
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
  const rows = await query<{ data: unknown; created_at: Date }>(
    `SELECT data, created_at FROM ${TABLA} WHERE mes = $1`,
    [mes]
  );
  if (rows.length === 0) return null;

  // Si es mes actual y tiene más de 24h, refrescar en background
  const mesActual = new Date().getMonth() + 1;
  if (mes === mesActual) {
    const age = Date.now() - new Date(rows[0].created_at).getTime();
    if (age > REFRESH_MS) {
      syncMesBackground(mes);
    }
  }

  return rows[0].data;
}
