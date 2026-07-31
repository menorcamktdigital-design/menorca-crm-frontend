"use client";

import { useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import type { ResumenCanal, ResumenAnuncio } from "@/types";

const n = (v: number | undefined) => (v ?? 0).toLocaleString("es-PE");

/**
 * El cache en Postgres puede tener datos guardados antes de que existieran los
 * montos y el nivel de anuncio. Hasta el siguiente sync esos campos llegan
 * undefined, así que se degrada a vacío en vez de romper la página.
 */
const usd = (v: number | undefined) =>
  v === undefined || v === null
    ? "—"
    : v.toLocaleString("es-PE", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

const ADS_MANAGER = "https://adsmanager.facebook.com/adsmanager/manage/ads";

// Debe coincidir con la etiqueta que usa el sync en @/lib/ventas-sync
const SIN_ANUNCIO = "Anuncio no identificado";

/**
 * Con ad_id se abre el anuncio exacto; sin él solo queda buscar por nombre,
 * porque Sperant guarda el anuncio como texto y no todos cruzan con Meta.
 */
function linkAnuncio(a: ResumenAnuncio): string | null {
  if (a.ad_id) return `${ADS_MANAGER}?selected_ad_ids=${a.ad_id}`;
  if (a.nombre === SIN_ANUNCIO) return null;
  return `${ADS_MANAGER}?${new URLSearchParams({ search: a.nombre })}`;
}

const CANAL_BADGE: Record<string, string> = {
  "Meta Ads": "bg-blue-100 text-blue-800",
  Web: "bg-purple-100 text-purple-800",
  WhatsApp: "bg-green-100 text-green-800",
  Referido: "bg-amber-100 text-amber-800",
  "Gestión directa": "bg-gray-100 text-gray-800",
  TikTok: "bg-red-100 text-red-800",
  Google: "bg-yellow-100 text-yellow-800",
  Otro: "bg-slate-100 text-slate-600",
  "Sin atribuir": "bg-slate-100 text-slate-500",
};

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

function IconoExterno() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function FilaAnuncio({ anuncio }: { anuncio: ResumenAnuncio }) {
  const href = linkAnuncio(anuncio);
  const sinIdentificar = anuncio.nombre === SIN_ANUNCIO;

  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={
            anuncio.ad_id
              ? `Abrir "${anuncio.nombre}" en Ads Manager`
              : `Buscar "${anuncio.nombre}" en Ads Manager (sin ID exacto)`
          }
          className={`group flex min-w-0 flex-1 items-center gap-1.5 truncate ${
            anuncio.ad_id
              ? "text-blue-600 hover:underline"
              : "text-gray-600 hover:text-blue-600 hover:underline"
          }`}
        >
          <span className="truncate">{anuncio.nombre}</span>
          <IconoExterno />
        </a>
      ) : (
        <span
          className={`min-w-0 flex-1 truncate ${sinIdentificar ? "italic text-gray-400" : "text-gray-600"}`}
          title={anuncio.nombre}
        >
          {anuncio.nombre}
        </span>
      )}
      <span className="w-24 text-right text-xs text-gray-500">{usd(anuncio.monto)}</span>
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
        <span className="w-24 text-right">Monto</span>
        <span className="w-12 text-right">Ventas</span>
      </div>

      <ul className="divide-y divide-gray-50">
        {canales.map((c) => (
          <li key={c.canal}>
            <button
              onClick={() => c.campanas.length > 0 && toggle(setCanalesAbiertos, c.canal)}
              className="flex w-full items-center gap-2 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              {c.campanas.length > 0 ? (
                <Chevron abierto={canalesAbiertos.has(c.canal)} />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${CANAL_BADGE[c.canal] ?? CANAL_BADGE.Otro}`}>
                {c.canal}
              </span>
              <span className="min-w-0 flex-1" />
              <span className="w-24 text-right text-xs font-medium text-gray-500">
                {usd(c.monto)}
              </span>
              <span className="w-12 text-right text-sm font-bold text-gray-900">
                {n(c.total)}
              </span>
            </button>

            {canalesAbiertos.has(c.canal) && (
              <ul className="max-h-[320px] overflow-y-auto border-l-2 border-gray-100 pb-1 pl-4">
                {c.campanas.map((camp) => {
                  const clave = `${c.canal}|${camp.nombre}`;
                  // Cache anterior al nivel de anuncio: sin `anuncios` la
                  // campaña simplemente no se expande.
                  const anuncios = camp.anuncios ?? [];
                  // Un solo anuncio sin identificar no aporta nivel extra:
                  // la campaña ya dice todo lo que se sabe.
                  const expandible =
                    anuncios.length > 1 ||
                    (anuncios.length === 1 && anuncios[0].nombre !== SIN_ANUNCIO);

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
                        <span className="min-w-0 flex-1 truncate text-gray-700" title={camp.nombre}>
                          {camp.nombre}
                        </span>
                        <span className="w-24 text-right text-xs text-gray-500">
                          {usd(camp.monto)}
                        </span>
                        <span className="w-12 text-right font-medium text-gray-700">
                          {n(camp.total)}
                        </span>
                      </button>

                      {expandible && campanasAbiertas.has(clave) && (
                        <ul className="border-l-2 border-gray-100 pb-1 pl-6">
                          {anuncios.map((a) => (
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

export default function VentasPorCanal({
  canales,
  cargando,
  error,
  sinCard,
}: {
  canales: ResumenCanal[];
  cargando: boolean;
  error: boolean;
  sinCard?: boolean;
}) {
  const interior = (
    <EstadoDatos cargando={cargando} error={error} vacio={canales.length === 0}>
      <Contenido canales={canales} />
    </EstadoDatos>
  );

  if (sinCard) return interior;

  return (
    <ChartCard
      titulo="Ventas por canal, campaña y anuncio"
      subtitulo="Atribución por primera interacción (first touch) — expande para llegar al anuncio"
    >
      {interior}
    </ChartCard>
  );
}
