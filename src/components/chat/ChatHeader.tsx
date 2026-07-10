"use client";

import Avatar from "@/components/ui/Avatar";
import { BADGE_CONFIG, type Contacto } from "@/types";
import { useUIStore } from "@/store/uiStore";

export default function ChatHeader({ contacto }: { contacto: Contacto | undefined }) {
  const numeroActivo = useUIStore((s) => s.numeroActivo);
  const setNumeroActivo = useUIStore((s) => s.setNumeroActivo);

  const nombre = contacto?.nombre || numeroActivo || "";
  const subinfo = [
    numeroActivo,
    contacto?.proyecto_interes,
    contacto ? BADGE_CONFIG[contacto.estado]?.label : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
      {/* Botón volver — solo móvil */}
      <button
        onClick={() => setNumeroActivo(null)}
        className="text-gray-500 hover:text-gray-900 md:hidden"
        aria-label="Volver"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      <Avatar nombre={contacto?.nombre || null} numero={numeroActivo || ""} size="md" />
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-gray-900">{nombre}</h2>
        <p className="truncate text-sm text-gray-500">{subinfo}</p>
      </div>
    </header>
  );
}
