"use client";

import { useUIStore } from "@/store/uiStore";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import LeadsPanel from "@/components/leads/LeadsPanel";

export default function ConversacionesPage() {
  const tab = useUIStore((s) => s.tab);
  const numeroActivo = useUIStore((s) => s.numeroActivo);

  // En móvil solo se muestra un panel a la vez:
  // sidebar por defecto; chat si hay número activo; leads si el tab es leads
  const mostrarPanelEnMovil = tab === "leads" || !!numeroActivo;

  return (
    <main className="flex h-full overflow-hidden bg-gray-100">
      <div
        className={`${mostrarPanelEnMovil ? "hidden" : "flex"} h-full w-full md:flex md:w-auto`}
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
