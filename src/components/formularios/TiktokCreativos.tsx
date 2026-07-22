"use client";

import { useState } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import EstadoDatos from "@/components/marketing/EstadoDatos";
import type { CreativoTiktok } from "@/hooks/useFormulariosTiktok";

const TOP = 9;
const n = (v: number) => v.toLocaleString("es-PE");

// Las miniaturas del CDN de TikTok pueden venir como http: se fuerzan a
// https para que el navegador no las bloquee por contenido mixto.
const https = (u: string) => u.replace(/^http:\/\//, "https://");

// Miniatura del anuncio de TikTok. Si hay video_url (preview del creativo),
// la imagen es clicable y abre el video en una pestaña nueva.
function Media({ creativo }: { creativo: CreativoTiktok }) {
  const [rota, setRota] = useState(false);

  if (!creativo.thumbnailUrl || rota) {
    return (
      <div className="flex h-36 w-full flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-2xl">
        {creativo.videoUrl ? "🎬" : "🖼️"}
        <span className="text-[10px] font-medium text-gray-400">
          {creativo.videoUrl ? "Video sin vista previa" : "Sin creativo"}
        </span>
      </div>
    );
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={https(creativo.thumbnailUrl)}
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
        title="Ver el anuncio en TikTok"
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

function TarjetaCreativo({ creativo }: { creativo: CreativoTiktok }) {
  const c = creativo;
  return (
    <div className="flex flex-col rounded-xl border border-gray-100 p-3">
      <Media creativo={c} />
      <div className="mt-2.5 min-h-[3.5rem] flex-1">
        <p className="line-clamp-2 text-sm font-medium text-gray-800" title={c.campana}>
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

// Grid de creativos de TikTok (miniatura + campaña/anuncio + funnel). La
// miniatura y el link de video vienen resueltos en la fila (backfill por la
// API de TikTok, guardados en formulario_tiktok).
export default function TiktokCreativos({
  creativos,
  cargando,
  error,
}: {
  creativos: CreativoTiktok[];
  cargando: boolean;
  error: boolean;
}) {
  const [todos, setTodos] = useState(false);
  const conCreativo = creativos.filter((c) => c.thumbnailUrl || c.videoUrl);
  const visibles = todos ? conCreativo : conCreativo.slice(0, TOP);
  return (
    <ChartCard
      titulo="Creativos de TikTok"
      subtitulo="El anuncio real que vio el lead · ordenado por leads generados"
    >
      <EstadoDatos cargando={cargando} error={error} vacio={conCreativo.length === 0}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((c, i) => (
            <TarjetaCreativo key={`${c.anuncio}-${i}`} creativo={c} />
          ))}
        </div>
        {conCreativo.length > TOP && (
          <button
            onClick={() => setTodos((v) => !v)}
            className="mt-3 text-sm font-medium text-[#00a884] hover:underline"
          >
            {todos ? "Mostrar menos" : `Mostrar todos (${conCreativo.length})`}
          </button>
        )}
      </EstadoDatos>
    </ChartCard>
  );
}
