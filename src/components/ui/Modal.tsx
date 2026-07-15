"use client";

import { useEffect } from "react";
import { useModalStore } from "@/store/modalStore";

// Panel global que se desliza desde la derecha. Se monta una sola vez en
// el layout de la app; cualquier componente lo dispara con
// useModalStore.getState().showModal(<Contenido />, { title }) sin tener
// que montar su propio modal ni manejar overlay/escape/scroll-lock.
export default function Modal() {
  const abierto = useModalStore((s) => s.abierto);
  const content = useModalStore((s) => s.content);
  const title = useModalStore((s) => s.title);
  const widthClass = useModalStore((s) => s.widthClass);
  const closeModal = useModalStore((s) => s.closeModal);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, closeModal]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={closeModal}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex h-full w-full ${widthClass} flex-col bg-white shadow-xl`}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <h2 className="min-w-0 truncate text-base font-semibold text-gray-900">{title}</h2>
            <button
              onClick={closeModal}
              aria-label="Cerrar"
              className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">{content}</div>
      </div>
    </div>
  );
}
