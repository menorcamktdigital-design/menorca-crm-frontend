import type { Mensaje } from "@/types";
import { formatHora } from "@/lib/fecha";
import MessageStatus from "./MessageStatus";

export default function MessageBubble({ mensaje }: { mensaje: Mensaje }) {
  const esIA = mensaje.rol === "assistant";
  const media = mensaje.media_url;
  const esVideo = media && (media.includes("video") || media.includes(".mp4"));

  return (
    <div className={`flex ${esIA ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg shadow-sm md:max-w-[65%] overflow-hidden ${
          esIA ? "bg-[#d9fdd3]" : "bg-white"
        }`}
      >
        {media ? (
          esVideo ? (
            <video
              src={media}
              controls
              className="max-h-64 w-full rounded-lg"
            />
          ) : (
            <a href={media} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media}
                alt="imagen"
                className="max-h-64 w-full object-cover cursor-pointer"
              />
            </a>
          )
        ) : (
          <div className="px-3 py-2">
            <p className="text-sm whitespace-pre-wrap text-gray-900">
              {mensaje.mensaje}
            </p>
          </div>
        )}
        <p className="px-3 pb-1.5 text-right text-[11px] text-gray-400 flex items-center justify-end gap-1">
          {formatHora(mensaje.fecha)}
          {esIA && <MessageStatus estado={mensaje.estado_entrega} />}
        </p>
      </div>
    </div>
  );
}
