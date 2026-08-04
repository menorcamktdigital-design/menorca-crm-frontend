"use client";

import { useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import { badgeCanal } from "@/lib/canal-estilo";
import { SIN_ANUNCIO, SIN_CAMPANA } from "@/lib/ventas-agrupar";
import type {
  MetricasMeta,
  MontoPorMoneda,
  ResumenCanal,
  ResumenAnuncio,
} from "@/types";

const n = (v: number) => v.toLocaleString("es-PE");
const usd = (v: number) => `$${Math.round(v).toLocaleString("es-PE")}`;
const usd2 = (v: number) =>
  `$${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Hay contratos en USD y en PEN. Se muestran uno por línea en vez de sumarlos,
 * porque la data de Sperant no trae tipo de cambio y convertir con una tasa
 * inventada daría un total falso.
 */
function Montos({ montos }: { montos: MontoPorMoneda }) {
  const entradas = Object.entries(montos).filter(([, v]) => v > 0);
  if (entradas.length === 0) return <span className="text-gray-400">—</span>;

  return (
    <span className="inline-flex flex-col items-end leading-tight">
      {entradas.map(([moneda, valor]) => (
        <span key={moneda} className="tabular-nums">
          {moneda} {n(Math.round(valor))}
        </span>
      ))}
    </span>
  );
}

/**
 * No se enlaza a Ads Manager. Se probaron `selected_ad_ids` (solo marca el
 * anuncio como seleccionado, la tabla sigue mostrando los 4,600 de la cuenta) y
 * `filter_set`, y ninguno filtra: el link llevaba a un listado completo donde
 * había que buscar el anuncio a mano. Volver a intentarlo requiere probar en un
 * Chrome con sesión de Meta abierta.
 */
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

function FilaAnuncio({ anuncio }: { anuncio: ResumenAnuncio }) {
  const sinIdentificar = anuncio.nombre === SIN_ANUNCIO;

  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      <span
        className={`min-w-0 flex-1 truncate ${sinIdentificar ? "italic text-gray-400" : "text-gray-600"}`}
        title={
          sinIdentificar
            ? "Sperant no registró el anuncio en esta venta"
            : anuncio.nombre
        }
      >
        {anuncio.nombre}
      </span>
      {anuncio.otroProyecto > 0 && (
        <span
          className="shrink-0 rounded bg-violet-50 px-1 py-0.5 text-[10px] font-medium text-violet-600"
          title={`${anuncio.otroProyecto} de estas ventas entraron por este aviso pero terminaron comprando otro proyecto`}
        >
          {anuncio.otroProyecto} de otro proyecto
        </span>
      )}
      <span className="w-28 text-right text-xs text-gray-500">
        <Montos montos={anuncio.montos} />
      </span>
      <span className="w-12 text-right font-medium text-gray-700">{n(anuncio.total)}</span>
    </li>
  );
}

function Contenido({ canales }: { canales: ResumenCanal[] }) {
  const [canalesAbiertos, setCanalesAbiertos] = useState<Set<string>>(new Set());
  const [campanasAbiertas, setCampanasAbiertas] = useState<Set<string>>(new Set());

  const toggle = (
    set: React.Dispatch<React.SetStateAction<Set<string>>>,
    clave: string
  ) =>
    set((prev) => {
      const s = new Set(prev);
      if (s.has(clave)) s.delete(clave);
      else s.add(clave);
      return s;
    });

  return (
    <>
      <div className="flex items-center border-b border-gray-100 pb-2 text-xs font-medium text-gray-500">
        <span className="flex-1">Canal / Campaña / Anuncio</span>
        <span className="w-28 text-right">Monto vendido</span>
        <span className="w-12 text-right">Ventas</span>
      </div>

      <ul className="divide-y divide-gray-50">
        {canales.map((c) => (
          <li key={c.canal}>
            <button
              onClick={() => c.campanas.length > 0 && toggle(setCanalesAbiertos, c.canal)}
              className="flex w-full items-center gap-2 py-2.5 text-left text-sm hover:bg-gray-50"
              title={
                c.campanas.length === 0
                  ? "Este canal no trae campañas de ads, no hay más detalle que mostrar"
                  : undefined
              }
            >
              {c.campanas.length > 0 ? (
                <Chevron abierto={canalesAbiertos.has(c.canal)} />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeCanal(c.canal)}`}>
                {c.canal}
              </span>
              <span className="min-w-0 flex-1" />
              <span className="w-28 text-right text-xs font-medium text-gray-500">
                <Montos montos={c.montos} />
              </span>
              <span className="w-12 text-right text-sm font-bold text-gray-900">
                {n(c.total)}
              </span>
            </button>

            {canalesAbiertos.has(c.canal) && (
              <ul className="max-h-[320px] overflow-y-auto border-l-2 border-gray-100 pb-1 pl-4">
                {c.campanas.map((camp) => {
                  const clave = `${c.canal}|${camp.nombre}`;
                  // Un solo anuncio sin identificar no aporta nivel extra: la
                  // campaña ya dice todo lo que se sabe.
                  const expandible =
                    camp.anuncios.length > 1 ||
                    (camp.anuncios.length === 1 && camp.anuncios[0].nombre !== SIN_ANUNCIO);
                  const esSinCampana = camp.nombre === SIN_CAMPANA;

                  return (
                    <li key={clave}>
                      <button
                        onClick={() => expandible && toggle(setCampanasAbiertas, clave)}
                        className="flex w-full items-center gap-2 py-1.5 text-left text-sm hover:bg-gray-50"
                      >
                        {expandible ? (
                          <Chevron abierto={campanasAbiertas.has(clave)} />
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        <span
                          className={`min-w-0 flex-1 truncate ${esSinCampana ? "italic text-gray-400" : "text-gray-700"}`}
                          title={
                            esSinCampana
                              ? camp.nombre
                              : camp.esCampanaMeta
                                ? `Campaña real de Meta: ${camp.nombre}`
                                : `"${camp.nombre}" es la etiqueta que guardó Sperant en utm_campaign. No corresponde a ninguna campaña, conjunto ni anuncio de la cuenta publicitaria.`
                          }
                        >
                          {camp.nombre}
                          {!esSinCampana && !camp.esCampanaMeta && (
                            <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium text-slate-500">
                              etiqueta Sperant
                            </span>
                          )}
                        </span>
                        <span className="w-28 text-right text-xs text-gray-500">
                          <Montos montos={camp.montos} />
                        </span>
                        <span className="w-12 text-right font-medium text-gray-700">
                          {n(camp.total)}
                        </span>
                      </button>

                      {expandible && campanasAbiertas.has(clave) && (
                        <ul className="border-l-2 border-gray-100 pb-1 pl-6">
                          {camp.anuncios.map((a) => (
                            <FilaAnuncio key={a.nombre} anuncio={a} />
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * La inversión de la fila de Meta solo suma los anuncios que cerraron alguna
 * venta de este mes. El total de la cuenta incluye todo lo demás, así que se
 * muestra aparte: sin ese número el costo por venta parece mucho mejor de lo
 * que es.
 */
function NotaGasto({
  metricas,
  ventasMeta,
}: {
  metricas?: MetricasMeta;
  ventasMeta: number;
}) {
  if (!metricas || metricas.totalCuenta.gasto === 0) return null;

  const t = metricas.totalCuenta;
  // Este es el costo por venta que vale para decidir presupuesto: toda la
  // inversión del mes contra todas las ventas que originó Meta, incluidos los
  // anuncios que no cerraron nada y las ventas sin anuncio identificado.
  const cacReal = ventasMeta > 0 ? t.gasto / ventasMeta : null;

  return (
    <div className="mt-3 space-y-1 border-t border-gray-100 pt-2 text-[11px] leading-relaxed text-gray-400">
      {cacReal !== null && (
        <p className="text-gray-600">
          Costo por venta de Meta este mes:{" "}
          <span className="font-semibold text-gray-800">{usd(cacReal)}</span>{" "}
          ({usd(t.gasto)} invertidos / {n(ventasMeta)} ventas de origen Meta).
        </p>
      )}
      <p>
        Inversión de la cuenta entre {metricas.desde} y {metricas.hasta}: {usd(t.gasto)} con{" "}
        {n(t.leads)} leads{t.cpl !== null && ` (${usd2(t.cpl)} CPL)`}.
        {!metricas.completo &&
          " Meta no respondió en el último sync, el gasto puede estar incompleto."}
      </p>
    </div>
  );
}

export default function VentasPorCanal({
  canales,
  cargando,
  error,
  metricas,
  sinCard,
}: {
  canales: ResumenCanal[];
  cargando: boolean;
  error: boolean;
  metricas?: MetricasMeta;
  sinCard?: boolean;
}) {
  const interior = (
    <EstadoDatos cargando={cargando} error={error} vacio={canales.length === 0}>
      <Contenido canales={canales} />
      <NotaGasto
        metricas={metricas}
        ventasMeta={canales.find((c) => c.canal === "Meta Ads")?.total ?? 0}
      />
    </EstadoDatos>
  );

  if (sinCard) return interior;

  return (
    <ChartCard
      titulo="Ventas por canal"
      subtitulo="De dónde vino cada venta: el primer contacto del cliente con ese proyecto"
    >
      {interior}
    </ChartCard>
  );
}
