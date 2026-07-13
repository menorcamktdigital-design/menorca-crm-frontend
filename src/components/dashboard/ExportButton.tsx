"use client";

import { descargarCSV } from "@/lib/csv";
import { COLUMNAS_CSV, filasCSV } from "@/lib/leads";
import type { Contacto } from "@/types";

export default function ExportButton({
  contactos,
  plaza,
}: {
  contactos: Contacto[];
  plaza: string;
}) {
  const exportar = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    const sufijo =
      plaza === "todas" ? "" : `_${plaza.replace(/[^\w-]+/g, "-").toLowerCase()}`;
    descargarCSV(`leads_menorca${sufijo}_${fecha}.csv`, COLUMNAS_CSV, filasCSV(contactos));
  };

  return (
    <button
      onClick={exportar}
      disabled={contactos.length === 0}
      className="flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#029676] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      Descargar base (CSV)
    </button>
  );
}
