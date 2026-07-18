"use client";

import { useMemo, useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import {
  arbolAnuncios,
  esPlaceholder,
  type Anuncio,
  type Campana,
  type Funnel,
  type NodoCampana,
} from "@/lib/marketing";
import type { RangoFechas } from "@/types";
import AnuncioProyectos from "./AnuncioProyectos";
import EstadoDatos from "./EstadoDatos";

const TOP = 10;

const n = (v: number) => v.toLocaleString("es-PE");

// Ancho fijo por columna para que todos los niveles y el encabezado
// queden alineados
const COL = "w-10 text-right sm:w-14";

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
      <span className={`${COL} hidden text-gray-500 sm:block`}>{n(funnel.conversando)}</span>
      <span className={`${COL} text-gray-500`}>{n(funnel.derivados)}</span>
      <span className={`${COL} text-gray-500`}>
        {funnel.ratio !== null ? `${funnel.ratio}%` : "—"}
      </span>
    </div>
  );
}

// Funnel único de Meta Ads: campañas como filas principales
// (/stats/campanas) y, al expandir, el desglose conjunto → anuncio
// (/stats/anuncios). Expandir un anuncio muestra qué proyectos declararon
// sus leads. Es la misma data en dos niveles: la campaña es la suma de
// sus anuncios.
export default function CampanasFunnel({
  campanas,
  anuncios,
  rango,
  proyecto,
  cargando,
  error,
}: {
  campanas: Campana[];
  anuncios: Anuncio[];
  rango?: RangoFechas;
  proyecto?: string;
  cargando: boolean;
  error: boolean;
}) {
  // Desglose por campaña, indexado por nombre de texto: es la única clave
  // que /stats/campanas y /stats/anuncios comparten de forma confiable
  // (campaign_id no siempre viene en /stats/anuncios)
  const arbol = useMemo(() => {
    const m = new Map<string, NodoCampana>();
    for (const nodo of arbolAnuncios(anuncios)) m.set(nodo.campana, nodo);
    return m;
  }, [anuncios]);

  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [todas, setTodas] = useState(false);
  const visibles = todas ? campanas : campanas.slice(0, TOP);

  const toggle = (clave: string) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(clave)) s.delete(clave);
      else s.add(clave);
      return s;
    });

  return (
    <ChartCard
      titulo="Funnel por campaña y anuncio"
      subtitulo="Qué campaña trae leads y cuáles terminan derivados · expande una campaña para ver conjuntos y anuncios, y un anuncio para ver sus proyectos de interés"
    >
      <EstadoDatos cargando={cargando} error={error} vacio={campanas.length === 0}>
        {/* Encabezado de las 4 métricas */}
        <div className="flex items-center border-b border-gray-100 pb-2 text-xs font-medium text-gray-500">
          <span className="flex-1">Campaña / conjunto / anuncio</span>
          <div className="ml-auto flex shrink-0">
            <span className={COL}>Leads</span>
            <span className={`${COL} hidden sm:block`}>Conv.</span>
            <span className={COL}>Deriv.</span>
            <span className={COL}>Ratio</span>
          </div>
        </div>

        <ul className="divide-y divide-gray-50">
          {visibles.map((c, i) => {
            const claveCampana = c.campana;
            const kCampana = `c:${claveCampana}`;
            const nodo = arbol.get(claveCampana);
            return (
              <li key={`${claveCampana}-${i}`}>
                <button
                  onClick={() => nodo && toggle(kCampana)}
                  disabled={!nodo}
                  className={`flex w-full items-center gap-2 py-2.5 text-left text-sm ${nodo ? "hover:bg-gray-50" : "cursor-default"}`}
                >
                  {nodo ? <Chevron abierto={abiertos.has(kCampana)} /> : <span className="w-3.5 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800" title={c.campana}>
                    {esPlaceholder(c.campana) ? "📦 Catálogo dinámico" : c.campana}
                  </span>
                  <Metricas funnel={c} fuerte />
                </button>

                {abiertos.has(kCampana) &&
                  nodo?.adsets.map((a) => {
                    const kAdset = `a:${claveCampana}|${a.adset}`;
                    // Nombres de anuncio repetidos dentro del mismo conjunto:
                    // dos anuncios reales distintos que comparten texto. Se
                    // distinguen mostrando el ad_id chico debajo del nombre.
                    const nombresRepetidos = new Set(
                      a.anuncios
                        .map((an) => an.anuncio)
                        .filter((nombre, i, arr) => arr.indexOf(nombre) !== i)
                    );
                    return (
                      <div key={a.adset} className="pl-5">
                        <button
                          onClick={() => toggle(kAdset)}
                          className="flex w-full items-center gap-2 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Chevron abierto={abiertos.has(kAdset)} />
                          <span className="min-w-0 flex-1 truncate text-gray-700" title={a.adset}>
                            {a.adset}
                          </span>
                          <Metricas funnel={a.funnel} />
                        </button>

                        {abiertos.has(kAdset) &&
                          a.anuncios.map((an, iAn) => {
                            // El índice hace la clave única aunque el backend
                            // devuelva el mismo ad_id en dos filas (nombre de
                            // texto distinto por COALESCE la.ad_name/first_ad_name):
                            // sin él, ambos nodos comparten toggle y se abren juntos.
                            const kAnuncio = `n:${claveCampana}|${a.adset}|${an.adId || an.anuncio}|${iAn}`;
                            return (
                              <div key={kAnuncio}>
                                <button
                                  onClick={() => toggle(kAnuncio)}
                                  className="flex w-full items-center gap-2 py-2 pl-5 text-left text-sm hover:bg-gray-50"
                                >
                                  <Chevron abierto={abiertos.has(kAnuncio)} />
                                  <span className="min-w-0 flex-1 truncate text-left">
                                    <span className="block truncate text-gray-600" title={an.anuncio}>
                                      {an.anuncio}
                                    </span>
                                    {nombresRepetidos.has(an.anuncio) && an.adId && (
                                      <span className="block truncate text-[10px] text-gray-400">
                                        {an.adId}
                                      </span>
                                    )}
                                  </span>
                                  <Metricas funnel={an} />
                                </button>
                                {abiertos.has(kAnuncio) && (
                                  <div className="border-l-2 border-gray-100 pb-2 pl-10">
                                    <AnuncioProyectos adId={an.adId} campaignId={c.campaignId} rango={rango} totalLeads={an.leads} proyecto={proyecto} />
                                  </div>
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

        {campanas.length > TOP && (
          <button
            onClick={() => setTodas((v) => !v)}
            className="mt-3 text-sm font-medium text-[#00a884] hover:underline"
          >
            {todas ? "Mostrar menos" : `Mostrar todas (${campanas.length})`}
          </button>
        )}
      </EstadoDatos>
    </ChartCard>
  );
}
