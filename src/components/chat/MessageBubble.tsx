import type { Mensaje } from "@/types";
import { formatHora } from "@/lib/fecha";

export default function MessageBubble({ mensaje }: { mensaje: Mensaje }) {
  const esIA = mensaje.rol === "assistant";

  return (
    <div className={`flex ${esIA ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm md:max-w-[65%] ${
          esIA ? "bg-[#d9fdd3]" : "bg-white"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap text-gray-900">
          {mensaje.mensaje}
        </p>
        <p className="mt-1 text-right text-[11px] text-gray-400">
          {formatHora(mensaje.fecha)}
        </p>
      </div>
    </div>
  );
}
