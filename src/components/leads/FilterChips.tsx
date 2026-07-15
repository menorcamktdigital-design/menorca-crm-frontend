"use client";

import { useUIStore, type FiltroLead } from "@/store/uiStore";

const CHIPS: { id: FiltroLead; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "en_conversacion", label: "Conversando" },
  { id: "recontacto", label: "Recontactos" },
  { id: "derivado", label: "Derivados" },
];

export default function FilterChips() {
  const filtroLead = useUIStore((s) => s.filtroLead);
  const setFiltroLead = useUIStore((s) => s.setFiltroLead);

  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          onClick={() => setFiltroLead(chip.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filtroLead === chip.id
              ? "bg-[#00a884] text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
