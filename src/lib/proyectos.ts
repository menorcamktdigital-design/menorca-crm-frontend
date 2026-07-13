import type { Contacto } from "@/types";

export const SIN_PROYECTO = "Sin proyecto";
export const OTROS = "Otros";

// Lista oficial de proyectos (fuente: Notion). Los filtros muestran SOLO
// estos nombres; el texto libre de la BD se mapea contra esta lista.
export const PROYECTOS = [
  "Alto Piura",
  "Brisas de Ventanilla",
  "Caleta San Antonio",
  "Costa Linda",
  "El Carbón",
  "El Olivar de Pisco",
  "La Quebrada",
  "Las Rompientes",
  "Lirios de Carabayllo",
  "Los Pecanos",
  "Mala Comercio",
  "Mirador de San Antonio",
  "Posada del Sol Chiclayo",
  "Praderas El Olivar 2",
  "Praderas El Olivar 3",
  "San Antonio de Chiclayo 3",
  "San Antonio de Mala",
  "San Antonio de Pachacamac",
  "Villa Posada del Sol Chiclayo",
  "Villas de San Antonio Chorrillos",
  "Villas Punta Mar Casas",
  "Villas Punta Mar Lotes",
];

// proyecto_interes es texto libre que escribe el agente IA, por eso llega
// con variantes ("Punta Mar-Casas" / "Punta Mar - Casas"), mayúsculas
// inconsistentes, typos y varios proyectos en un solo campo ("A, B").
// Aquí se normaliza todo a un nombre canónico único.

const ALIAS: Record<string, string> = {
  pradreras: "praderas", // typo frecuente en la BD
};

// Artículos como "El"/"Las" se mantienen capitalizados (son parte del nombre
// propio: "Praderas El Olivar", "Las Rompientes")
const MINUSCULAS = new Set(["de", "del", "y", "en"]);

function sinAcentos(s: string): string {
  // rango de diacríticos combinantes U+0300–U+036F
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// "villas punta mar-casas" → "Villas Punta Mar Casas"
function canonizar(fragmento: string): string {
  const tokens = fragmento
    .toLowerCase()
    .replace(/[-–_/]+/g, " ")
    .replace(/[^\p{L}\p{N} ]+/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((t) => ALIAS[sinAcentos(t)] || t);

  return tokens
    .map((t, i) =>
      i > 0 && MINUSCULAS.has(t) ? t : t.charAt(0).toUpperCase() + t.slice(1)
    )
    .join(" ");
}

// Divide un campo con varios proyectos: "A, B" · "A y B" · "Olivar 2 y 3"
function dividir(raw: string): string[] {
  const partes = raw.split(/\s*,\s*|\s+y\s+/i).filter(Boolean);
  const out: string[] = [];
  for (const p of partes) {
    // "Praderas El Olivar 2 y 3" → la parte "3" hereda la base anterior
    if (/^\d+$/.test(p.trim()) && out.length > 0) {
      const base = out[out.length - 1].replace(/\s*\d+$/, "");
      out.push(`${base} ${p.trim()}`);
    } else {
      out.push(p);
    }
  }
  return out;
}

// Clave de comparación: minúsculas, sin acentos ni espacios/símbolos
// ("Costa Linda" y "Costalinda" comparten clave)
const clave = (s: string) => sinAcentos(s.toLowerCase()).replace(/[^a-z0-9]/g, "");

const CLAVES = PROYECTOS.map((p) => ({ p, k: clave(p) }));

// Mapea texto libre al nombre oficial de PROYECTOS (o lo deja igual si no
// se reconoce; esos caen en el grupo "Otros")
function aOficial(nombre: string): string {
  const k = clave(nombre);
  if (!k) return nombre;
  const exacto = CLAVES.find((c) => c.k === k);
  if (exacto) return exacto.p;
  // el texto contiene un nombre oficial: "Condominio Caleta San Antonio"
  const dentro = CLAVES.filter((c) => k.includes(c.k)).sort(
    (a, b) => b.k.length - a.k.length
  );
  if (dentro.length > 0) return dentro[0].p;
  // el texto es parte de un ÚNICO oficial: "San Antonio de Chiclayo" → "... 3"
  // (si es ambiguo, como "Praderas El Olivar", se deja tal cual)
  if (k.length >= 6) {
    const candidatos = CLAVES.filter((c) => c.k.includes(k));
    if (candidatos.length === 1) return candidatos[0].p;
  }
  return nombre;
}

export function esOficial(p: string): boolean {
  return PROYECTOS.includes(p);
}

// Proyectos de un contacto, ya mapeados a nombres oficiales
// ([] si no declaró ninguno)
export function proyectosDe(c: Contacto): string[] {
  const raw = c.proyecto_interes?.trim();
  if (!raw) return [];
  return [...new Set(dividir(raw).map(canonizar).filter(Boolean).map(aOficial))];
}

// Opciones para los filtros: la lista oficial + "Otros" (texto no
// reconocido) + "Sin proyecto" (no declaró), solo si aplican en la base
export function listaProyectos(contactos: Contacto[]): string[] {
  const lista = [...PROYECTOS];
  if (contactos.some((c) => proyectosDe(c).some((p) => !esOficial(p))))
    lista.push(OTROS);
  if (contactos.some((c) => proyectosDe(c).length === 0)) lista.push(SIN_PROYECTO);
  return lista;
}

// ¿El contacto pertenece al proyecto? (SIN_PROYECTO = no declaró ninguno;
// OTROS = declaró algo que no está en la lista oficial)
export function perteneceAProyecto(c: Contacto, proyecto: string): boolean {
  const lista = proyectosDe(c);
  if (proyecto === SIN_PROYECTO) return lista.length === 0;
  if (proyecto === OTROS) return lista.some((p) => !esOficial(p));
  return lista.includes(proyecto);
}
