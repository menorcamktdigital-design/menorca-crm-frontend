// Todas las fechas de la BD representan hora de Perú (America/Lima, UTC-5)
// sin importar la zona horaria del navegador que las muestra: el backend
// corre en esa zona y las columnas de fecha son sin timezone. Se fija
// explícitamente acá en vez de confiar en la config regional del cliente,
// que puede diferir (Windows con otra zona, VPN, etc.) y correr las horas.
const TZ = "America/Lima";

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatFechaHoraLarga(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  });
}

// "Hoy" / "Ayer" / "lunes, 14 de julio" — separador de día en el historial
// de mensajes, mismo criterio que WhatsApp
export function formatSeparadorDia(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const claveDia = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD estable para comparar

  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  if (claveDia(fecha) === claveDia(hoy)) return "Hoy";
  if (claveDia(fecha) === claveDia(ayer)) return "Ayer";

  return new Date(iso).toLocaleDateString("es-PE", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Misma clave que formatSeparadorDia usa para comparar: dos fechas caen en
// el mismo separador si su día en hora de Perú coincide.
export function claveDiaLima(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}
