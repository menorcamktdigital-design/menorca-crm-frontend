"use client";

import { useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import { esPlaceholder, type Creativo } from "@/lib/marketing";
import type { RangoFechas } from "@/types";
import AnuncioProyectos from "./AnuncioProyectos";
import EstadoDatos from "./EstadoDatos";

const TOP = 9;

const n = (v: number) => v.toLocaleString("es-PE");

// Imagen del anuncio o thumbnail del video; los videos llevan overlay ▶ y
// clic abre el video en Facebook
function Media({ creativo }: { creativo: Creativo }) {
  const [rota, setRota] = useState(false);
  const c = creativo;
  const url = c.imagenUrl;

  if (!url || rota) {
    return (
      <div className="flex h-36 w-full flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-2xl">
        {c.tipoMedia === "video" ? "🎬" : "🖼️"}
        <span className="text-[10px] font-medium text-gray-400">
          {c.tipoMedia === "video" ? "Video sin vista previa" : "Sin imagen"}
        </span>
      </div>
    );
  }

  // El creativo vive en el CDN de Meta (dominio variable y URLs firmadas):
  // <img> plano en vez de next/image para no mantener remotePatterns
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={c.esCatalogoDinamico ? c.anuncio : c.titulo || c.anuncio}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setRota(true)}
      className="h-36 w-full rounded-lg bg-gray-100 object-cover"
    />
  );

  if (c.tipoMedia === "video" && c.videoUrl) {
    return (
      <a
        href={c.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Ver video en Facebook"
        className="relative block"
      >
        {img}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 pl-0.5 text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v13.72c0 .86.94 1.38 1.67.93l10.9-6.86a1.1 1.1 0 0 0 0-1.86L9.67 4.2A1.1 1.1 0 0 0 8 5.14Z" />
            </svg>
          </span>
        </span>
      </a>
    );
  }
  return img;
}

function TarjetaCreativo({
  creativo,
  rango,
}: {
  creativo: Creativo;
  rango?: RangoFechas;
}) {
  const [verProyectos, setVerProyectos] = useState(false);
  const c = creativo;

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 p-3">
      <Media creativo={c} />

      <div className="mt-2.5 min-h-[3.5rem] flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {c.esCatalogoDinamico && (
            // titulo/texto son placeholders {{product.name}} sin resolver:
            // se identifica el anuncio por imagen + campaña/conjunto
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              📦 Catálogo dinámico
            </span>
          )}
          {c.tipoMedia === "video" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              🎬 Video
            </span>
          )}
        </div>

        {!c.esCatalogoDinamico && (
          <>
            {c.titulo && (
              <p className="line-clamp-2 text-sm font-medium text-gray-800" title={c.titulo}>
                {c.titulo}
              </p>
            )}
            {c.texto && (
              <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs text-gray-500" title={c.texto}>
                {c.texto}
              </p>
            )}
            {!c.titulo && !c.texto && (
              <p className="text-xs text-gray-400">Sin copy disponible</p>
            )}
          </>
        )}

        {/* Nombre interno del anuncio en Meta: identifica la pieza exacta */}
        <p className="mt-1.5 truncate text-xs text-gray-400" title={c.anuncio}>
          {c.anuncio}
        </p>
        <p
          className="truncate text-xs text-gray-400"
          title={`Campaña: ${c.campana} · Conjunto: ${c.adset}`}
        >
          {esPlaceholder(c.campana) ? "Catálogo" : c.campana} · {c.adset}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-3 border-t border-gray-100 pt-2 text-xs">
        <span>
          <span className="font-semibold text-gray-900">{n(c.leads)}</span>{" "}
          <span className="text-gray-500">leads</span>
        </span>
        <span>
          <span className="font-semibold text-gray-900">{n(c.derivados)}</span>{" "}
          <span className="text-gray-500">deriv.</span>
        </span>
        <span className="text-gray-500">
          {c.ratio !== null ? `${c.ratio}%` : "—"}
        </span>
        <button
          onClick={() => setVerProyectos((v) => !v)}
          className="ml-auto font-medium text-[#00a884] hover:underline"
        >
          {verProyectos ? "Ocultar" : "Proyectos"}
        </button>
      </div>

      {verProyectos && (
        <div className="mt-1 border-t border-gray-100 pt-1">
          <AnuncioProyectos anuncio={c.anuncio} rango={rango} />
        </div>
      )}
    </div>
  );
}

// Grid de creativos reales de Meta Ads (imagen/video + copy) con su funnel.
// Los de catálogo dinámico se marcan con badge en lugar del copy. Puede
// haber más de una fila por ad_id (variantes del creativo): la key lleva
// el índice para mantenerlas separadas.
export default function CreativosGrid({
  creativos,
  rango,
  cargando,
  error,
}: {
  creativos: Creativo[];
  rango?: RangoFechas;
  cargando: boolean;
  error: boolean;
}) {
  const [todos, setTodos] = useState(false);
  const visibles = todos ? creativos : creativos.slice(0, TOP);

  return (
    <ChartCard
      titulo="Creativos"
      subtitulo="El anuncio real que vio el lead (imagen, video y copy) · ordenado por leads generados"
    >
      <EstadoDatos cargando={cargando} error={error} vacio={creativos.length === 0}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((c, i) => (
            <TarjetaCreativo key={`${c.adId || c.anuncio}-${i}`} creativo={c} rango={rango} />
          ))}
        </div>

        {creativos.length > TOP && (
          <button
            onClick={() => setTodos((v) => !v)}
            className="mt-3 text-sm font-medium text-[#00a884] hover:underline"
          >
            {todos ? "Mostrar menos" : `Mostrar todos (${creativos.length})`}
          </button>
        )}
      </EstadoDatos>
    </ChartCard>
  );
}
