"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import LeadsPanel from "@/components/leads/LeadsPanel";

export default function ConversacionesPage() {
  const tab = useUIStore((s) => s.tab);
  const numeroActivo = useUIStore((s) => s.numeroActivo);
  const setNumeroActivo = useUIStore((s) => s.setNumeroActivo);
  const setTab = useUIStore((s) => s.setTab);

  // ?chat=<numero> abre esa conversación al cargar (links "abrir en otra
  // pestaña" desde la tabla de leads). Se lee de window para no requerir
  // el Suspense de useSearchParams; luego se limpia la URL.
  useEffect(() => {
    const numero = new URLSearchParams(window.location.search).get("chat");
    if (!numero) return;
    setNumeroActivo(numero);
    setTab("chats");
    window.history.replaceState(null, "", "/conversaciones");
  }, [setNumeroActivo, setTab]);

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
