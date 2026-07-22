// Árbol genérico de 3 niveles para los funnels de TikTok (campaña →
// anuncio → proyecto) y Web (fuente → medio → campaña). Mismo criterio que
// arbolFunnel (lib/formulariosFunnel.ts): el backend agrupa y cuenta filas
// planas, acá se arma la jerarquía y cada nivel suma sus hijos.

import type { Funnel } from "@/lib/formulariosFunnel";

const ratioDe = (derivados: number, leads: number): number | null =>
  leads > 0 ? Math.round((derivados / leads) * 1000) / 10 : null;

export function funnelDe(leads: number, derivados: number): Funnel {
  return { leads, derivados, ratio: ratioDe(derivados, leads) };
}

function sumarFunnels(items: Funnel[]): Funnel {
  const leads = items.reduce((acc, f) => acc + f.leads, 0);
  const derivados = items.reduce((acc, f) => acc + f.derivados, 0);
  return funnelDe(leads, derivados);
}

// Fila plana del backend ya mapeada: n1/n2/n3 son los 3 niveles del árbol
export interface FilaCanal {
  n1: string;
  n2: string;
  n3: string;
  funnel: Funnel;
}

export interface NodoHoja {
  nombre: string;
  funnel: Funnel;
}

export interface NodoMedio {
  nombre: string;
  funnel: Funnel;
  hijos: NodoHoja[];
}

export interface NodoRaiz {
  nombre: string;
  funnel: Funnel;
  hijos: NodoMedio[];
}

const porLeads = <T extends { funnel: Funnel }>(a: T, b: T) =>
  b.funnel.leads - a.funnel.leads;

export function arbolCanal(filas: FilaCanal[]): NodoRaiz[] {
  const raiz = new Map<string, Map<string, FilaCanal[]>>();

  for (const f of filas) {
    const medios = raiz.get(f.n1) ?? new Map<string, FilaCanal[]>();
    raiz.set(f.n1, medios);
    medios.set(f.n2, [...(medios.get(f.n2) ?? []), f]);
  }

  return [...raiz.entries()]
    .map(([nombre, medios]) => {
      const hijos = [...medios.entries()]
        .map(([medio, lista]) => {
          // Varias filas pueden compartir hoja (p. ej. mismo proyecto en
          // distintos ad_id): se agrupan y suman para no repetir key
          const porHoja = new Map<string, FilaCanal[]>();
          for (const f of lista) {
            porHoja.set(f.n3, [...(porHoja.get(f.n3) ?? []), f]);
          }
          return {
            nombre: medio,
            funnel: sumarFunnels(lista.map((f) => f.funnel)),
            hijos: [...porHoja.entries()]
              .map(([hoja, fs]) => ({
                nombre: hoja,
                funnel: sumarFunnels(fs.map((f) => f.funnel)),
              }))
              .sort(porLeads),
          };
        })
        .sort(porLeads);
      return {
        nombre,
        funnel: sumarFunnels(hijos.map((n) => n.funnel)),
        hijos,
      };
    })
    .sort(porLeads);
}
