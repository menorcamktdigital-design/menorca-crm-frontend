import type { Mensaje, MediaType } from "@/types";
import { formatHora } from "@/lib/fecha";
import MessageStatus from "./MessageStatus";

function tipoMedia(m: Mensaje): MediaType | null {
  if (m.media_type) return m.media_type;
  if (!m.media_url) return null;
  // fallback para filas viejas sin media_type
  if (m.media_url.includes("video") || m.media_url.includes(".mp4")) return "video";
  return "image";
}

// texto placeholder que no vale la pena mostrar bajo la media
const PLACEHOLDERS = new Set(["[imagen]", "[video]", "[audio]", "[documento]"]);

// etiqueta limpia cuando el placeholder queda sin media (borrada o expirada)
const PLACEHOLDER_LABELS: Record<string, string> = {
  "[imagen]": "📷 Imagen",
  "[video]": "🎥 Video",
  "[audio]": "🎤 Audio",
  "[documento]": "📎 Documento",
};

export default function MessageBubble({ mensaje }: { mensaje: Mensaje }) {
  const esIA = mensaje.rol === "assistant";
  const media = mensaje.media_url;
  const tipo = tipoMedia(mensaje);
  const texto = (mensaje.mensaje || "").trim();
  const mostrarTexto = texto && !PLACEHOLDERS.has(texto);

  return (
    <div className={`flex ${esIA ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg shadow-sm md:max-w-[65%] overflow-hidden ${
          esIA ? "bg-[#d9fdd3]" : "bg-white"
        }`}
      >
        {media && tipo === "image" && (
          <a href={media} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media}
              alt="imagen"
              className="max-h-64 w-full object-cover cursor-pointer"
            />
          </a>
        )}

        {media && tipo === "video" && (
          <video src={media} controls className="max-h-64 w-full rounded-lg" />
        )}

        {media && tipo === "audio" && (
          <div className="px-3 pt-2">
            <audio src={media} controls className="w-full" />
          </div>
        )}

        {media && tipo === "document" && (
          <a
            href={media}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:underline"
          >
            <span aria-hidden>📎</span>
            {mostrarTexto ? texto : "Documento"}
          </a>
        )}

        {/* texto: si no hay media, o transcripción de audio / caption */}
        {mostrarTexto && tipo !== "document" && (
          <div className="px-3 py-2">
            {media && (
              <p className="mb-0.5 text-[11px] text-gray-400">
                {tipo === "audio" ? "Transcripción:" : ""}
              </p>
            )}
            <p className="text-sm whitespace-pre-wrap text-gray-900">{texto}</p>
          </div>
        )}

        {!media && !mostrarTexto && (
          <div className="px-3 py-2">
            <p className="text-sm text-gray-400">
              {PLACEHOLDER_LABELS[texto] || texto || " "}
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
