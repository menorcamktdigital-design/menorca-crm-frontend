/**
 * Colores de canal en un solo lugar. Estaban copiados en VentasPorCanal,
 * VentasTabla, VentasStatTiles y VentasComparativo, así que al agregar canales
 * nuevos (Aliados inmobiliarios, Activaciones, Institucional) unos quedaban
 * pintados y otros en gris por defecto.
 */

const BADGES: Record<string, string> = {
  "Meta Ads": "bg-blue-100 text-blue-800",
  TikTok: "bg-red-100 text-red-800",
  Google: "bg-yellow-100 text-yellow-800",
  Web: "bg-purple-100 text-purple-800",
  WhatsApp: "bg-green-100 text-green-800",
  Referido: "bg-amber-100 text-amber-800",
  Embajadoras: "bg-pink-100 text-pink-800",
  "Aliados inmobiliarios": "bg-cyan-100 text-cyan-800",
  Activaciones: "bg-orange-100 text-orange-800",
  "Medios masivos": "bg-rose-100 text-rose-800",
  "Gestión directa": "bg-gray-100 text-gray-800",
  Institucional: "bg-indigo-100 text-indigo-800",
  Otro: "bg-slate-100 text-slate-600",
  "Sin atribuir": "bg-slate-100 text-slate-500",
  "Sin cruce": "bg-slate-100 text-slate-500",
};

const COLORES: Record<string, string> = {
  "Meta Ads": "#2a78d6",
  TikTok: "#ef4444",
  Google: "#eab308",
  Web: "#7c3aed",
  WhatsApp: "#00a884",
  Referido: "#eda100",
  Embajadoras: "#db2777",
  "Aliados inmobiliarios": "#0891b2",
  Activaciones: "#f97316",
  "Medios masivos": "#e11d48",
  "Gestión directa": "#94a3b8",
  Institucional: "#6366f1",
  Otro: "#cbd5e1",
  "Sin atribuir": "#e2e8f0",
  "Sin cruce": "#e2e8f0",
};

export const badgeCanal = (canal: string): string =>
  BADGES[canal] ?? BADGES.Otro;

export const colorCanal = (canal: string): string =>
  COLORES[canal] ?? COLORES.Otro;

/* ---------- Estado de contrato ------------------------------------------- */
/**
 * Se muestran todas las ventas, incluidas canceladas, para que el total cuadre
 * con el BI. El badge es lo que evita que una cancelada pase por venta viva.
 */
export const ESTADO_BADGE: Record<string, string> = {
  Pendiente: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-red-100 text-red-700",
  Resuelto: "bg-orange-100 text-orange-700",
};

export const badgeEstado = (estado: string): string =>
  ESTADO_BADGE[estado] ?? "bg-slate-100 text-slate-600";

/** Estados que no son una venta viva. */
export const ESTADOS_CAIDOS = new Set(["Cancelado", "Resuelto"]);
