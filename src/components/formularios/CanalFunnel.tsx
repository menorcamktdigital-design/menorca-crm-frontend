"use client";

import { useMemo, useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import { arbolCanal, type FilaCanal } from "@/lib/canalFunnel";
import type { Funnel } from "@/lib/formulariosFunnel";

const TOP = 10;

const n = (v: number) => v.toLocaleString("es-PE");

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

// Funnel expandible de 3 niveles (n1 → n2 → n3), versión genérica del de
// Meta (FormulariosFunnel, que tiene 4). Lo usan Forms · TikTok (campaña →
// anuncio → proyecto) y Forms · Web (fuente → medio → campaña).
export default function CanalFunnel({
  filas,
  cargando,
  error,
  titulo,
  subtitulo,
  encabezado,
}: {
  filas: FilaCanal[];
  cargando: boolean;
  error: boolean;
  titulo: string;
  subtitulo: string;
  encabezado: string; // "Campaña / anuncio / proyecto"
}) {
  const arbol = useMemo(() => arbolCanal(filas), [filas]);

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
    <ChartCard titulo={titulo} subtitulo={subtitulo}>
      <EstadoDatos cargando={cargando} error={error} vacio={arbol.length === 0}>
        <div className="flex items-center border-b border-gray-100 pb-2 text-xs font-medium text-gray-500">
          <span className="flex-1">{encabezado}</span>
          <div className="ml-auto flex shrink-0">
            <span className={COL}>Leads</span>
            <span className={COL}>Deriv.</span>
            <span className={COL}>Ratio</span>
          </div>
        </div>

        <ul className="divide-y divide-gray-50">
          {visibles.map((r) => {
            const kRaiz = `r:${r.nombre}`;
            return (
              <li key={r.nombre}>
                <button
                  onClick={() => toggle(kRaiz)}
                  className="flex w-full items-center gap-2 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  <Chevron abierto={abiertos.has(kRaiz)} />
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800" title={r.nombre}>
                    {r.nombre}
                  </span>
                  <Metricas funnel={r.funnel} fuerte />
                </button>

                {abiertos.has(kRaiz) &&
                  r.hijos.map((m) => {
                    const kMedio = `m:${r.nombre}|${m.nombre}`;
                    return (
                      <div key={m.nombre} className="pl-5">
                        <button
                          onClick={() => toggle(kMedio)}
                          className="flex w-full items-center gap-2 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Chevron abierto={abiertos.has(kMedio)} />
                          <span className="min-w-0 flex-1 truncate text-gray-700" title={m.nombre}>
                            {m.nombre}
                          </span>
                          <Metricas funnel={m.funnel} />
                        </button>

                        {abiertos.has(kMedio) && (
                          <ul className="border-l-2 border-gray-100 pb-1 pl-5">
                            {m.hijos.map((h) => (
                              <li
                                key={h.nombre}
                                className="flex items-center gap-2 py-1.5 pl-5 text-sm"
                              >
                                <span className="min-w-0 flex-1 truncate text-gray-500" title={h.nombre}>
                                  {h.nombre}
                                </span>
                                <Metricas funnel={h.funnel} />
                              </li>
                            ))}
                          </ul>
                        )}
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
