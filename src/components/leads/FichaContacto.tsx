"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFichaContacto } from "@/hooks/useFichaContacto";
import { useModalStore } from "@/store/modalStore";
import { useUIStore } from "@/store/uiStore";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { formatFechaHoraLarga as formatFecha } from "@/lib/fecha";
import { slugDeNumero } from "@/lib/slug";
import type { Touch } from "@/types";

const FUENTE_LABEL: Record<string, string> = {
  meta_ad: "Meta",
  organico: "Orgánico",
  whatsapp_directo: "WhatsApp directo",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 flex-1 text-right font-medium break-words text-gray-900">
        {valor ?? "—"}
      </span>
    </div>
  );
}

function TouchCard({ touch, esPrimero }: { touch: Touch; esPrimero: boolean }) {
  const media = touch.image_url || touch.thumbnail_url;
  const esVideo = touch.meta_media_type === "video" && touch.video_url;
  // Campaña es lo único que identifica el anuncio de forma legible:
  // meta_headline suele repetirse igual ("Conoce más aquí") en varios
  // anuncios distintos, así que no sirve como título.
  const titulo = touch.campaign_name || touch.meta_headline || touch.ad_name || "Anuncio";

  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            esPrimero ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {esPrimero ? "Primer touch" : "Touch posterior"}
        </span>
        <span className="text-[11px] text-gray-400">{formatFecha(touch.created_at)}</span>
      </div>

      {media && (
        <a
          href={esVideo ? touch.video_url! : media}
          target="_blank"
          rel="noreferrer"
          title={esVideo ? "Ver video del anuncio" : "Ver imagen del anuncio"}
          className="relative mb-2 block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media}
            alt={titulo}
            referrerPolicy="no-referrer"
            className="h-32 w-full rounded-md object-cover"
          />
          {esVideo && (
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800">
                ▶
              </span>
            </span>
          )}
        </a>
      )}

      <p className="text-sm font-medium text-gray-800 break-words">{titulo}</p>
      {touch.meta_body && (
        <p className="mt-0.5 whitespace-pre-line text-xs text-gray-500">{touch.meta_body}</p>
      )}

      <div className="mt-2 space-y-0.5 text-xs text-gray-500">
        <p className="break-words">
          Conjunto: <span className="text-gray-700">{touch.adset_name || "—"}</span>
        </p>
        <p className="break-words">
          Anuncio: <span className="text-gray-700">{touch.ad_name || "—"}</span>
        </p>
        {touch.ad_id && <p className="truncate text-gray-400">ad_id: {touch.ad_id}</p>}
      </div>
    </div>
  );
}

export default function FichaContacto({ numero }: { numero: string }) {
  const { data, isLoading, isError } = useFichaContacto(numero);
  const closeModal = useModalStore((s) => s.closeModal);
  const setNumeroActivo = useUIStore((s) => s.setNumeroActivo);
  const setTab = useUIStore((s) => s.setTab);
  const pathname = usePathname();
  const router = useRouter();

  const verConversacion = () => {
    setNumeroActivo(numero);
    setTab("chats");
    closeModal();
    // Desde otras vistas (Visitas, etc.) hay que navegar a /conversaciones;
    // dentro de /conversaciones basta el cambio de estado.
    if (pathname !== "/conversaciones") {
      router.push(`/conversaciones?c=${slugDeNumero(numero)}`);
    }
  };

  if (isLoading) {
    return <p className="p-5 text-sm text-gray-400">Cargando ficha...</p>;
  }
  if (isError || !data) {
    return <p className="p-5 text-sm text-gray-400">No se pudo cargar la información de este lead.</p>;
  }

  const { contacto: c, touches } = data;
  const primerTouch = touches.find((t) => t.is_first_touch) ?? touches[0];
  const otrosTouches = touches.filter((t) => t !== primerTouch);

  return (
    <div className="pb-4">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <Avatar nombre={c.nombre} numero={c.numero} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{c.nombre || "Sin nombre"}</p>
          <p className="text-sm text-gray-500 select-all">{c.numero}</p>
        </div>
        <Badge estado={c.estado} />
      </div>

      <div className="px-5 pt-3">
        <a
          href={`/conversaciones?c=${slugDeNumero(numero)}`}
          onClick={(e) => { e.preventDefault(); verConversacion(); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00a884] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#009073]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
          </svg>
          Ver conversación
        </a>
      </div>

      <Seccion titulo="Datos del lead">
        <Campo label="Estado" valor={<Badge estado={c.estado} />} />
        <Campo label="Proyecto de interés" valor={c.proyecto_interes || "Sin proyecto"} />
        <Campo label="Mensajes" valor={c.total_mensajes} />
        <Campo label="Creado" valor={formatFecha(c.creado_en)} />
        <Campo label="Última actividad" valor={formatFecha(c.ultima_actividad)} />
      </Seccion>

      <Seccion titulo="Origen (primer contacto)">
        <Campo
          label="Fuente"
          valor={
            (c.first_source_type && FUENTE_LABEL[c.first_source_type]) ||
            c.first_source_type ||
            "—"
          }
        />
        <Campo label="Campaña" valor={primerTouch?.campaign_name || c.first_campaign_name} />
        <Campo label="Conjunto de anuncios" valor={primerTouch?.adset_name || c.first_adset_name} />
        <Campo label="Anuncio" valor={primerTouch?.ad_name || c.first_ad_name} />
        {c.first_ad_id && (
          <Campo label="ad_id" valor={<span className="text-xs text-gray-400">{c.first_ad_id}</span>} />
        )}
        {(c.first_utm_source || c.first_utm_medium || c.first_utm_campaign) && (
          <>
            <Campo label="UTM source" valor={c.first_utm_source} />
            <Campo label="UTM medium" valor={c.first_utm_medium} />
            <Campo label="UTM campaign" valor={c.first_utm_campaign} />
          </>
        )}
      </Seccion>

      {touches.length > 0 && (
        <Seccion titulo={`Creativos vistos (${touches.length})`}>
          <div className="space-y-3">
            {primerTouch && <TouchCard touch={primerTouch} esPrimero />}
            {otrosTouches.map((t) => (
              <TouchCard key={t.id} touch={t} esPrimero={false} />
            ))}
          </div>
        </Seccion>
      )}

      {touches.length === 0 && (
        <Seccion titulo="Creativos vistos">
          <p className="text-sm text-gray-400">
            Sin datos de atribución de anuncios para este lead.
          </p>
        </Seccion>
      )}
    </div>
  );
}
