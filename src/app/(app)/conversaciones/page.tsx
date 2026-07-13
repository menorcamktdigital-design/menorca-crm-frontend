"use client";

import { useUIStore } from "@/store/uiStore";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import LeadsPanel from "@/components/leads/LeadsPanel";

export default function ConversacionesPage() {
  const tab = useUIStore((s) => s.tab);
  const numeroActivo = useUIStore((s) => s.numeroActivo);

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
