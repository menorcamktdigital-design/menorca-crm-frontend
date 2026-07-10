"use client";

import { useUIStore } from "@/store/uiStore";

export default function SearchInput() {
  const busqueda = useUIStore((s) => s.busqueda);
  const setBusqueda = useUIStore((s) => s.setBusqueda);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
        <svg
          className="h-4 w-4 shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o número..."
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
