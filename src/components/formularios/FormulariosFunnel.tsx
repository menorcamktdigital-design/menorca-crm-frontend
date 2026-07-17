"use client";

import { useMemo, useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import { arbolFunnel, type FilaFunnel, type Funnel } from "@/lib/formulariosFunnel";

const TOP = 10;

const n = (v: number) => v.toLocaleString("es-PE");

// Ancho fijo por columna para que todos los niveles y el encabezado
// queden alineados
const COL = "w-14 text-right sm:w-16";

function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${abierto ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function Metricas({ funnel, fuerte }: { funnel: Funnel; fuerte?: boolean }) {
  return (
    <div className="ml-auto flex shrink-0 text-xs">
      <span className={`${COL} ${fuerte ? "font-semibold text-gray-900" : "text-gray-700"}`}>
        {n(funnel.leads)}
      </span>
      <span className={`${COL} text-gray-500`}>{n(funnel.derivados)}</span>
      <span className={`${COL} text-gray-500`}>
        {funnel.ratio !== null ? `${funnel.ratio}%` : "—"}
      </span>
    </div>
  );
}

// Funnel jerárquico de formularios: campaña (utm_campaign) → conjunto
// (utm_term) → anuncio (utm_content) → proyecto (proyecto_nombre). Cada
// nivel suma los leads/derivados de sus hijos. Mismo componente expandible
// que el funnel de Marketing (CampanasFunnel), con un nivel extra.
export default function FormulariosFunnel({
  filas,
  cargando,
  error,
}: {
  filas: FilaFunnel[];
  cargando: boolean;
  error: boolean;
}) {
  const arbol = useMemo(() => arbolFunnel(filas), [filas]);

  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [todas, setTodas] = useState(false);
  const visibles = todas ? arbol : arbol.slice(0, TOP);

  const toggle = (clave: string) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(clave)) s.delete(clave);
      else s.add(clave);
      return s;
    });

  return (
    <ChartCard
      titulo="Funnel por campaña, conjunto y anuncio"
      subtitulo="Qué campaña trae leads de formulario y cuáles terminan derivados · expande para ver conjuntos, anuncios y proyectos de interés"
    >
      <EstadoDatos cargando={cargando} error={error} vacio={arbol.length === 0}>
        <div className="flex items-center border-b border-gray-100 pb-2 text-xs font-medium text-gray-500">
          <span className="flex-1">Campaña / conjunto / anuncio / proyecto</span>
          <div className="ml-auto flex shrink-0">
            <span className={COL}>Leads</span>
            <span className={COL}>Deriv.</span>
            <span className={COL}>Ratio</span>
          </div>
        </div>

        <ul className="divide-y divide-gray-50">
          {visibles.map((c) => {
            const kCampana = `c:${c.campana}`;
            return (
              <li key={c.campana}>
                <button
                  onClick={() => toggle(kCampana)}
                  className="flex w-full items-center gap-2 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  <Chevron abierto={abiertos.has(kCampana)} />
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800" title={c.campana}>
                    {c.campana}
                  </span>
                  <Metricas funnel={c.funnel} fuerte />
                </button>

                {abiertos.has(kCampana) &&
                  c.conjuntos.map((cj) => {
                    const kConjunto = `j:${c.campana}|${cj.conjunto}`;
                    return (
                      <div key={cj.conjunto} className="pl-5">
                        <button
                          onClick={() => toggle(kConjunto)}
                          className="flex w-full items-center gap-2 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Chevron abierto={abiertos.has(kConjunto)} />
                          <span className="min-w-0 flex-1 truncate text-gray-700" title={cj.conjunto}>
                            {cj.conjunto}
                          </span>
                          <Metricas funnel={cj.funnel} />
                        </button>

                        {abiertos.has(kConjunto) &&
                          cj.anuncios.map((an) => {
                            const kAnuncio = `n:${c.campana}|${cj.conjunto}|${an.anuncio}`;
                            return (
                              <div key={an.anuncio} className="pl-5">
                                <button
                                  onClick={() => toggle(kAnuncio)}
                                  className="flex w-full items-center gap-2 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  <Chevron abierto={abiertos.has(kAnuncio)} />
                                  <span className="min-w-0 flex-1 truncate text-gray-600" title={an.anuncio}>
                                    {an.anuncio}
                                  </span>
                                  <Metricas funnel={an.funnel} />
                                </button>

                                {abiertos.has(kAnuncio) && (
                                  <ul className="border-l-2 border-gray-100 pb-1 pl-5">
                                    {an.proyectos.map((p) => (
                                      <li
                                        key={p.proyecto}
                                        className="flex items-center gap-2 py-1.5 pl-5 text-sm"
                                      >
                                        <span className="min-w-0 flex-1 truncate text-gray-500" title={p.proyecto}>
                                          {p.proyecto}
                                        </span>
                                        <Metricas funnel={p.funnel} />
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
              </li>
            );
          })}
        </ul>

        {arbol.length > TOP && (
          <button
            onClick={() => setTodas((v) => !v)}
            className="mt-3 text-sm font-medium text-[#00a884] hover:underline"
          >
            {todas ? "Mostrar menos" : `Mostrar todas (${arbol.length})`}
          </button>
        )}
      </EstadoDatos>
    </ChartCard>
  );
}
