"use client";

import { useUIStore } from "@/store/uiStore";
import { useContactos, flatContactos } from "@/hooks/useContactos";
import Placeholder from "@/components/ui/Placeholder";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";

export default function ChatPanel() {
  const numeroActivo = useUIStore((s) => s.numeroActivo);
  const { data } = useContactos();

  if (!numeroActivo) {
    return (
      <div className="hidden h-full flex-1 bg-gray-100 md:block">
        <Placeholder />
      </div>
    );
  }

  const contacto = flatContactos(data?.pages).find(
    (c) => c.numero === numeroActivo
  );

  return (
    <section className="flex h-full flex-1 flex-col">
      <ChatHeader contacto={contacto} />
      <MessageList numero={numeroActivo} />
    </section>
  );
}
