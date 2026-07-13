import type { Contacto } from "@/types";

// 'recontacto' es legacy en BD → cuenta como 'derivado'
export function coincideEstado(c: Contacto, estado: string): boolean {
  if (estado === "todos") return true;
  if (estado === "derivado") return c.estado === "derivado" || c.estado === "recontacto";
  return c.estado === estado;
}
