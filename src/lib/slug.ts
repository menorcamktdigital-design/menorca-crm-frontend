// Identificador de conversación para URLs: el número no se expone en texto
// plano (protección de datos ante links compartidos/historial). Es
// ofuscación reversible (base64url), no cifrado: suficiente para no mostrar
// el teléfono a simple vista, sin necesitar tabla de ids en el backend.

export function slugDeNumero(numero: string): string {
  if (typeof window === "undefined") return "";
  return btoa(numero).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function numeroDeSlug(slug: string): string | null {
  try {
    const b64 = slug.replace(/-/g, "+").replace(/_/g, "/");
    const numero = atob(b64);
    // Un número de WhatsApp son solo dígitos; cualquier otra cosa es un slug corrupto
    return /^\d{6,20}$/.test(numero) ? numero : null;
  } catch {
    return null;
  }
}
