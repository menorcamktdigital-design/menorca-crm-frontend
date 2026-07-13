import type { Contacto } from "@/types";

// 'recontacto' es legacy en BD → cuenta como 'derivado'
export function coincideEstado(c: Contacto, estado: string): boolean {
  if (estado === "todos") return true;
  if (estado === "derivado") return c.estado === "derivado" || c.estado === "recontacto";
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
