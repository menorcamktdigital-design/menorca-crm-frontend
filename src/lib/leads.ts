import { BADGE_CONFIG, type Contacto } from "@/types";
import { proyectosDe } from "./proyectos";

const TZ = "America/Lima";

export function coincideEstado(c: Contacto, estado: string): boolean {
  if (estado === "todos") return true;
  return c.estado === estado;
}

// Búsqueda insensible a mayúsculas y acentos ("pena" encuentra "Peña")
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// ¿El contacto coincide con el texto buscado? (por número o por nombre)
export function coincideBusqueda(c: Contacto, busqueda: string): boolean {
  const q = normalizar(busqueda.trim());
  if (!q) return true;
  return c.numero.includes(q) || normalizar(c.nombre || "").includes(q);
}

// Columnas del CSV de leads (dashboard y tabla exportan lo mismo). Solo lo
// esencial: el "último mensaje" traía saltos de línea y emojis que rompían
// el layout al abrirlo en Excel.
export const COLUMNAS_CSV = [
  { key: "nombre", label: "Nombre" },
  { key: "numero", label: "Celular" },
  { key: "proyecto", label: "Proyecto" },
  { key: "estado", label: "Estado" },
  { key: "creado_en", label: "Creado" },
  { key: "ultima_actividad", label: "Última actividad" },
];

const fechaCSV = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("es-PE", {
        timeZone: TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

export function filasCSV(contactos: Contacto[]) {
  return contactos.map((c) => ({
    nombre: c.nombre || "",
    numero: c.numero,
    // Nombres oficiales normalizados, no el texto libre de la BD
    proyecto: proyectosDe(c).join(", "),
    estado: BADGE_CONFIG[c.estado]?.label || c.estado,
    creado_en: fechaCSV(c.creado_en),
    ultima_actividad: fechaCSV(c.ultima_actividad),
  }));
}
