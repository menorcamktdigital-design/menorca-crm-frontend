"use client";

import { useState } from "react";
import { useTodosContactos } from "@/hooks/useTodosContactos";
import { descargarCSV } from "@/lib/csv";
import { COLUMNAS_CSV, filasCSV } from "@/lib/leads";
import { perteneceAProyecto } from "@/lib/proyectos";
import type { RangoFechas } from "@/types";

// La base completa se descarga recién al hacer clic (el dashboard ya no la
// necesita para las gráficas: usa los endpoints agregados). El rango de
// fechas se filtra en el servidor, igual que en las gráficas.
export default function ExportButton({
  plaza,
  rango,
}: {
  plaza: string;
  rango?: RangoFechas;
}) {
  const { refetch } = useTodosContactos(false, rango);
  const [descargando, setDescargando] = useState(false);

  const exportar = async () => {
    setDescargando(true);
    try {
      const { data } = await refetch();
      const base = data ?? [];
      const contactos =
        plaza === "todas" ? base : base.filter((c) => perteneceAProyecto(c, plaza));
      const fecha = new Date().toISOString().slice(0, 10);
      let sufijo =
        plaza === "todas" ? "" : `_${plaza.replace(/[^\w-]+/g, "-").toLowerCase()}`;
      if (rango?.desde || rango?.hasta)
        sufijo += `_${rango.desde || "inicio"}_a_${rango.hasta || "hoy"}`;
      descargarCSV(`leads_menorca${sufijo}_${fecha}.csv`, COLUMNAS_CSV, filasCSV(contactos));
    } finally {
      setDescargando(false);
    }
  };

  return (
    <button
      onClick={exportar}
      disabled={descargando}
      className="flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#029676] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      {descargando ? "Preparando..." : "Descargar base (CSV)"}
    </button>
  );
}
