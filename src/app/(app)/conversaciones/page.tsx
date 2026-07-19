"use client";

import { useEffect } from "react";
import { numeroDeSlug, slugDeNumero } from "@/lib/slug";
import { useUIStore } from "@/store/uiStore";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import LeadsPanel from "@/components/leads/LeadsPanel";

export default function ConversacionesPage() {
  const tab = useUIStore((s) => s.tab);
  const numeroActivo = useUIStore((s) => s.numeroActivo);
  const setNumeroActivo = useUIStore((s) => s.setNumeroActivo);
  const setTab = useUIStore((s) => s.setTab);

  // ?c=<slug> abre esa conversación al cargar (links "abrir en otra
  // pestaña"). El slug ofusca el número (lib/slug.ts) para no exponer el
  // teléfono en la URL. Se lee de window para no requerir el Suspense de
  // useSearchParams. ?chat=<numero> se acepta por compatibilidad.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const numero = params.get("c") ? numeroDeSlug(params.get("c")!) : params.get("chat");
    if (!numero) return;
    setNumeroActivo(numero);
    setTab("chats");
  }, [setNumeroActivo, setTab]);

  // La URL siempre refleja el chat activo (/conversaciones?c=SLUG): así se
  // puede copiar/compartir el link o recargar sin perder el chat.
  useEffect(() => {
    const url = numeroActivo
      ? `/conversaciones?c=${slugDeNumero(numeroActivo)}`
      : "/conversaciones";
    window.history.replaceState(null, "", url);
  }, [numeroActivo]);

  // En móvil solo se muestra un panel a la vez:
  // sidebar por defecto; chat si hay número activo; leads si el tab es leads.
  // En leads el sidebar se oculta también en desktop (vista a pantalla completa).
  const mostrarPanelEnMovil = tab === "leads" || !!numeroActivo;

  return (
    <main className="flex h-full overflow-hidden bg-gray-100">
      <div
        className={`${
          tab === "leads"
            ? "hidden"
            : mostrarPanelEnMovil
              ? "hidden md:flex"
              : "flex"
        } h-full w-full md:w-auto`}
      >
        <Sidebar />
      </div>

      <div
        className={`${mostrarPanelEnMovil ? "flex" : "hidden"} h-full min-w-0 flex-1 md:flex`}
      >
        {tab === "chats" ? <ChatPanel /> : <LeadsPanel />}
      </div>
    </main>
  );
}
