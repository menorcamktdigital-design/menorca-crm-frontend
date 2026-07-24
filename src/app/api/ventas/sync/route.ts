import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SPERANT = "https://apirest.menorca.services/api";
const CONCURRENCY = 15;
const SYNC_SECRET = process.env.SYNC_SECRET || "menorca-sync-2026";

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
  if (m.includes("pag.web") || m.includes("menorca_web") || m === "organic")
    return "Web";
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

/* ---------- Lógica de atribución (first touch) --------------------------- */
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

/* ---------- Fetch de interacciones con concurrencia ---------------------- */
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

/* ---------- Procesar un mes ---------------------------------------------- */
async function procesarMes(mes: number) {
  const ventasRes = await fetch(`${SPERANT}/consultar_ventas_mes?mes=${mes}`);
  if (!ventasRes.ok) {
    throw new Error(`Sperant respondió ${ventasRes.status} para mes=${mes}`);
  }

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

/* ---------- Asegurar tabla ----------------------------------------------- */
async function asegurarTabla() {
  await query(`
    CREATE TABLE IF NOT EXISTS ventas_historico_cache (
      mes INT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

/* ---------- POST handler: sincronizar ----------------------------------- */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.secret !== SYNC_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await asegurarTabla();

  const mesActual = new Date().getMonth() + 1;
  const mesesASincronizar = body.meses
    ? (body.meses as number[])
    : Array.from({ length: mesActual }, (_, i) => i + 1);

  const resultados: { mes: number; status: string; ventas?: number }[] = [];

  for (const mes of mesesASincronizar) {
    try {
      const data = await procesarMes(mes);
      await query(
        `INSERT INTO ventas_historico_cache (mes, data, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (mes) DO UPDATE SET data = $2, created_at = NOW()`,
        [mes, JSON.stringify(data)]
      );
      resultados.push({ mes, status: "ok", ventas: data.total });
    } catch (e) {
      resultados.push({ mes, status: `error: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  return NextResponse.json({
    sincronizados: resultados.filter((r) => r.status === "ok").length,
    total: mesesASincronizar.length,
    detalle: resultados,
  });
}
