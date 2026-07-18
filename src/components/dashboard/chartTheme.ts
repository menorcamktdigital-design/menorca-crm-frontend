// Paleta categórica del dashboard — validada (CVD ΔE mín. 16.6, banda de
// luminosidad OK). Amber y magenta quedan bajo 3:1 sobre blanco, por eso
// las gráficas siempre muestran leyenda con valores visibles.
export const ESTADO_CHART: { key: string; label: string; color: string }[] = [
  { key: "en_conversacion", label: "Conversando", color: "#eda100" },
  { key: "recontacto", label: "Recontacto", color: "#c2680a" },
  { key: "derivado", label: "Derivado", color: "#00a884" },
  { key: "visita_agendada", label: "Visita", color: "#2a78d6" },
  { key: "no_contesta", label: "No contesta", color: "#94a3b8" },
  { key: "no_interesado", label: "No interesado", color: "#ef4444" },
  { key: "nuevo", label: "Nuevo", color: "#4a3aa7" },
  { key: "frio", label: "Frío", color: "#e87ba4" },
];

export const ACCENT = "#00a884";
export const GRID = "#e9edef";
export const MUTED = "#667781";
