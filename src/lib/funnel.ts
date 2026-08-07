// Funnel de marketing por plaza. Cruza dos fuentes que se acumulan a diario en
// Postgres vía n8n: Google Ads (gasto) y GA4 (tráfico del sitio).
//
// Ojo al leer las etapas: los clics son SOLO de Google Ads, mientras que las
// sesiones son TODO el tráfico de la ficha del proyecto (orgánico, Meta, directo,
// referidos). Por eso las sesiones suelen superar a los clics y la relación entre
// ambas no es una tasa de conversión.

export type FilaFunnel = {
  inversion: number;
  clics: number;
  impresiones: number;
  conversiones: number;
  campanas: number;
  sesiones: number;
  usuarios: number;
  nuevos_usuarios: number;
  // Eventos de GA4 en la ficha del proyecto. form_send es el lead de verdad;
  // form_start mide cuántos empiezan y abandonan.
  form_start: number;
  form_send: number;
  whatsapp: number;
  maps_click: number;
};

export type FunnelMes = FilaFunnel & { mes: string };
export type FunnelPlaza = FilaFunnel & { plaza: string };

export type CampanaFunnel = {
  campaign_id: string;
  campaign_name: string;
  plaza: string;
  inversion: number;
  clics: number;
  impresiones: number;
  conversiones: number;
  ctr: number;
  cpc: number;
  // Eventos del sitio atribuidos a esta campaña por sessionCampaignId.
  form_start: number;
  form_send: number;
  whatsapp: number;
  maps_click: number;
};

export type SinPlaza = {
  campanas: { nombre: string; inversion: number; clics: number }[];
  paginas: { nombre: string; sesiones: number }[];
};

const num = (v: unknown) => Number(v) || 0;

function filaDeApi(r: Record<string, unknown>): FilaFunnel {
  return {
    inversion: num(r.inversion),
    clics: num(r.clics),
    impresiones: num(r.impresiones),
    conversiones: num(r.conversiones),
    campanas: num(r.campanas),
    sesiones: num(r.sesiones),
    usuarios: num(r.usuarios),
    nuevos_usuarios: num(r.nuevos_usuarios),
    form_start: num(r.form_start),
    form_send: num(r.form_send),
    whatsapp: num(r.whatsapp),
    maps_click: num(r.maps_click),
  };
}

export const mesesDeApi = (filas: Record<string, unknown>[]): FunnelMes[] =>
  filas.map((r) => ({ mes: String(r.mes ?? ""), ...filaDeApi(r) }));

export const plazasDeApi = (filas: Record<string, unknown>[]): FunnelPlaza[] =>
  filas.map((r) => ({ plaza: String(r.plaza ?? ""), ...filaDeApi(r) }));

export const campanasDeApi = (filas: Record<string, unknown>[]): CampanaFunnel[] =>
  filas.map((r) => ({
    campaign_id: String(r.campaign_id ?? ""),
    campaign_name: String(r.campaign_name ?? ""),
    plaza: String(r.plaza ?? ""),
    inversion: num(r.inversion),
    clics: num(r.clics),
    impresiones: num(r.impresiones),
    conversiones: num(r.conversiones),
    ctr: num(r.ctr),
    cpc: num(r.cpc),
    form_start: num(r.form_start),
    form_send: num(r.form_send),
    whatsapp: num(r.whatsapp),
    maps_click: num(r.maps_click),
  }));

export function sinPlazaDeApi(data: unknown): SinPlaza {
  const d = (data ?? {}) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  return {
    campanas: arr(d.campanas).map((c) => ({
      nombre: String(c.nombre ?? ""),
      inversion: num(c.inversion),
      clics: num(c.clics),
    })),
    paginas: arr(d.paginas).map((p) => ({
      nombre: String(p.nombre ?? ""),
      sesiones: num(p.sesiones),
    })),
  };
}

export function totales(filas: FilaFunnel[]): FilaFunnel {
  return filas.reduce<FilaFunnel>(
    (acc, f) => ({
      inversion: acc.inversion + f.inversion,
      clics: acc.clics + f.clics,
      impresiones: acc.impresiones + f.impresiones,
      conversiones: acc.conversiones + f.conversiones,
      campanas: acc.campanas + f.campanas,
      sesiones: acc.sesiones + f.sesiones,
      usuarios: acc.usuarios + f.usuarios,
      nuevos_usuarios: acc.nuevos_usuarios + f.nuevos_usuarios,
      form_start: acc.form_start + f.form_start,
      form_send: acc.form_send + f.form_send,
      whatsapp: acc.whatsapp + f.whatsapp,
      maps_click: acc.maps_click + f.maps_click,
    }),
    {
      inversion: 0, clics: 0, impresiones: 0, conversiones: 0,
      campanas: 0, sesiones: 0, usuarios: 0, nuevos_usuarios: 0,
      form_start: 0, form_send: 0, whatsapp: 0, maps_click: 0,
    }
  );
}

// "2026-06" → "Jun 2026"
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export function mesCorto(mes: string): string {
  const [anio, m] = mes.split("-");
  const i = Number(m) - 1;
  return MESES[i] ? `${MESES[i]} ${anio}` : mes;
}

// La cuenta de Google Ads (994-030-6035) factura en USD, no en soles: la interfaz
// de Google Ads muestra "$" y las cifras calzan exactamente con cost_micros.
export const soles = (v: number) =>
  `$ ${v.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const solesExacto = (v: number) =>
  `$ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// El CPC vive entre S/ 0.10 y S/ 3: con 0 decimales todos se verían como "S/ 0".
export const solesUnitario = (v: number) =>
  `$ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const entero = (v: number) => v.toLocaleString("es-PE");

export const porcentaje = (v: number) =>
  `${(v * 100).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

// Costo por clic del rango. Se recalcula sobre los totales en vez de promediar
// los CPC de cada fila: un mes con 3 clics pesaría igual que uno con 3,000.
export const cpcReal = (f: FilaFunnel) => (f.clics > 0 ? f.inversion / f.clics : 0);
export const ctrReal = (f: FilaFunnel) => (f.impresiones > 0 ? f.clics / f.impresiones : 0);

// Tráfico del sitio completo, de cualquier origen.
//
// Viene de mkt_ga4_sitio, que se pide a GA4 SIN desglosar por página. La tabla
// por página cuenta una misma sesión en cada página que visitó, así que sumarla
// infla el total ~24%; estos números sí cuadran con la interfaz de GA4.
export type WebMes = {
  mes: string;
  sesiones: number;
  usuarios: number;
  nuevos_usuarios: number;
  sesiones_google_ads: number;
  rebote: number;
};

export type CanalWeb = { canal: string; sesiones: number; rebote: number };
export type Web = { meses: WebMes[]; canales: CanalWeb[] };

export function webDeApi(data: unknown): Web {
  const d = (data ?? {}) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  return {
    meses: arr(d.meses).map((r) => ({
      mes: String(r.mes ?? ""),
      sesiones: num(r.sesiones),
      usuarios: num(r.usuarios),
      nuevos_usuarios: num(r.nuevos_usuarios),
      sesiones_google_ads: num(r.sesiones_google_ads),
      rebote: num(r.rebote),
    })),
    canales: arr(d.canales).map((c) => ({
      canal: String(c.canal ?? ""),
      sesiones: num(c.sesiones),
      rebote: num(c.rebote),
    })),
  };
}

export function totalesWeb(filas: WebMes[]) {
  const t = filas.reduce(
    (acc, f) => ({
      sesiones: acc.sesiones + f.sesiones,
      usuarios: acc.usuarios + f.usuarios,
      nuevos_usuarios: acc.nuevos_usuarios + f.nuevos_usuarios,
      sesiones_google_ads: acc.sesiones_google_ads + f.sesiones_google_ads,
      reboteXses: acc.reboteXses + f.rebote * f.sesiones,
    }),
    { sesiones: 0, usuarios: 0, nuevos_usuarios: 0, sesiones_google_ads: 0, reboteXses: 0 }
  );
  // El rebote se pondera por sesiones: promediar los meses daría el mismo peso
  // a un mes de 5,000 sesiones que a uno de 120,000.
  return { ...t, rebote: t.sesiones > 0 ? t.reboteXses / t.sesiones : 0 };
}

// Colores por canal para el reparto de tráfico. Los de Google pagado van en
// verde porque son los que el funnel de arriba está midiendo.
export const COLOR_CANAL: Record<string, string> = {
  "Paid Search": "bg-[#00a884]",
  "Cross-network": "bg-[#00a884]/60",
  "Organic Search": "bg-blue-500/70",
  "Direct": "bg-gray-400",
  "Organic Social": "bg-purple-400",
  "Paid Social": "bg-purple-600",
  "Referral": "bg-amber-400",
  "Email": "bg-pink-400",
};
export const colorCanal = (canal: string) => COLOR_CANAL[canal] ?? "bg-gray-300";


// Contactos que dejó una campaña: envíos de formulario más clics a WhatsApp.
// En esta cuenta WhatsApp pesa mucho más que el formulario, así que mirar solo
// form_send subestima el resultado por un factor de ~50.
export const contactos = (c: { form_send: number; whatsapp: number }) =>
  c.form_send + c.whatsapp;

// Cuánto costó cada contacto. Es el número que decide dónde mover presupuesto.
export const costoPorContacto = (c: CampanaFunnel) =>
  contactos(c) > 0 ? c.inversion / contactos(c) : 0;
