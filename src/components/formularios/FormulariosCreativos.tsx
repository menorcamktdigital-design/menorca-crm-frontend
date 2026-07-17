"use client";

import { useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import type { Creativo } from "@/lib/formulariosFunnel";

const TOP = 9;

const n = (v: number) => v.toLocaleString("es-PE");

// thumbnail_url ya viene resuelto desde Postgres (leads_formulario), no se
// llama a la API de Meta acá. Si hay video_id, la imagen es clicable y abre
// el video en Facebook (mismo patrón que CreativosGrid de Marketing); el
// link se arma con el ID (facebook.com/video.php?v=), sin garantía de que
// cargue si el video es privado.
function Media({ creativo }: { creativo: Creativo }) {
  const [rota, setRota] = useState(false);
  const url = creativo.thumbnailUrl;

  if (!url || rota) {
    return (
      <div className="flex h-36 w-full flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-2xl">
        {creativo.videoId ? "🎬" : "🖼️"}
        <span className="text-[10px] font-medium text-gray-400">
          {creativo.videoId ? "Video sin vista previa" : "Sin imagen"}
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
      alt={creativo.anuncio}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setRota(true)}
      className="h-36 w-full rounded-lg bg-gray-100 object-cover"
    />
  );

  if (creativo.videoUrl) {
    return (
      <a
        href={creativo.videoUrl}
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

function TarjetaCreativo({ creativo }: { creativo: Creativo }) {
  const c = creativo;
  return (
    <div className="flex flex-col rounded-xl border border-gray-100 p-3">
      <Media creativo={c} />

      <div className="mt-2.5 min-h-[3.5rem] flex-1">
        {c.videoId && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            🎬 Video
          </span>
        )}
        <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-800" title={c.campana}>
          {c.campana}
        </p>
        <p className="mt-1.5 truncate text-xs text-gray-400" title={c.anuncio}>
          {c.anuncio}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-3 border-t border-gray-100 pt-2 text-xs">
        <span>
          <span className="font-semibold text-gray-900">{n(c.funnel.leads)}</span>{" "}
          <span className="text-gray-500">leads</span>
        </span>
        <span>
          <span className="font-semibold text-gray-900">{n(c.funnel.derivados)}</span>{" "}
          <span className="text-gray-500">deriv.</span>
        </span>
        <span className="text-gray-500">{c.funnel.ratio !== null ? `${c.funnel.ratio}%` : "—"}</span>
      </div>
    </div>
  );
}

// Grid de creativos de formularios (imagen/thumbnail + copy) con su funnel.
// Igual patrón visual que CreativosGrid de Marketing; los datos ya vienen
// agregados por anuncio (utm_content) desde /formularios/funnel.
export default function FormulariosCreativos({
  creativos,
  cargando,
  error,
}: {
  creativos: Creativo[];
  cargando: boolean;
  error: boolean;
}) {
  const [todos, setTodos] = useState(false);
  const visibles = todos ? creativos : creativos.slice(0, TOP);

  return (
    <ChartCard
      titulo="Creativos"
      subtitulo="El anuncio real que vio el lead de formulario · ordenado por leads generados"
    >
      <EstadoDatos cargando={cargando} error={error} vacio={creativos.length === 0}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((c, i) => (
            <TarjetaCreativo key={c.adId || `${c.anuncio}-${i}`} creativo={c} />
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
