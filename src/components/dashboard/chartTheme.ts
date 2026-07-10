// Paleta categórica del dashboard — validada (CVD ΔE mín. 16.6, banda de
// luminosidad OK). Amber y magenta quedan bajo 3:1 sobre blanco, por eso
// las gráficas siempre muestran leyenda con valores visibles.
export const ESTADO_CHART: { key: string; label: string; color: string }[] = [
  { key: "en_conversacion", label: "Conversando", color: "#eda100" },
  { key: "derivado", label: "Derivado", color: "#00a884" },
  { key: "visita_agendada", label: "Visita", color: "#2a78d6" },
  { key: "nuevo", label: "Nuevo", color: "#4a3aa7" },
  { key: "frio", label: "Frío", color: "#e87ba4" },
];

export const ACCENT = "#00a884";
export const GRID = "#e9edef";
export const MUTED = "#667781";

// 'recontacto' es legacy → cuenta como 'derivado'
export function normalizarEstado(estado: string): string {
  return estado === "recontacto" ? "derivado" : estado;
}
