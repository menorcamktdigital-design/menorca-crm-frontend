"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useConversacion, flatMensajes } from "@/hooks/useConversacion";
import { claveDiaLima, formatSeparadorDia } from "@/lib/fecha";
import MessageBubble from "./MessageBubble";

function SeparadorDia({ fecha }: { fecha: string }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="rounded-lg bg-white/80 px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
        {formatSeparadorDia(fecha)}
      </span>
    </div>
  );
}

export default function MessageList({ numero }: { numero: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useConversacion(numero);

  const mensajes = flatMensajes(data?.pages);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const primeraCargaRef = useRef(true);
  const totalPrevioRef = useRef(0);

  // Al abrir el chat: scroll al fondo. Al llegar mensajes nuevos: mantener abajo.
  // Al cargar mensajes antiguos: restaurar la posición previa.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (prevScrollHeightRef.current !== null) {
      // Se cargaron mensajes antiguos arriba → compensar el scroll
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    } else if (primeraCargaRef.current && mensajes.length > 0) {
      el.scrollTop = el.scrollHeight;
      primeraCargaRef.current = false;
    } else if (mensajes.length > totalPrevioRef.current) {
      // Mensaje nuevo por polling: bajar solo si el usuario ya estaba cerca del fondo
      const cercaDelFondo =
        el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      if (cercaDelFondo) el.scrollTop = el.scrollHeight;
    }
    totalPrevioRef.current = mensajes.length;
  }, [mensajes.length]);

  // Reiniciar al cambiar de chat
  useEffect(() => {
    primeraCargaRef.current = true;
    totalPrevioRef.current = 0;
    prevScrollHeightRef.current = null;
  }, [numero]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 60 && hasNextPage && !isFetchingNextPage) {
      prevScrollHeightRef.current = el.scrollHeight - el.scrollTop;
      fetchNextPage();
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto bg-[#efeae2] px-4 py-4 md:px-10"
    >
      {isFetchingNextPage && (
        <p className="py-2 text-center text-xs text-gray-500">
          Cargando mensajes anteriores...
        </p>
      )}
      {isLoading && (
        <p className="py-10 text-center text-sm text-gray-500">
          Cargando conversación...
        </p>
      )}
      <div className="flex flex-col gap-2">
        {mensajes.map((m, i) => {
          const diaCambia = i === 0 || claveDiaLima(m.fecha) !== claveDiaLima(mensajes[i - 1].fecha);
          return (
            <div key={m.id ?? `${m.fecha}-${i}`}>
              {diaCambia && <SeparadorDia fecha={m.fecha} />}
              <MessageBubble mensaje={m} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
