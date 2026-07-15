"use client";

import { useState } from "react";
import { useTodosContactos } from "@/hooks/useTodosContactos";
import { descargarCSV } from "@/lib/csv";
import { COLUMNAS_CSV, filasCSV } from "@/lib/leads";
import { perteneceAProyecto } from "@/lib/proyectos";
import type { FiltrosLeads } from "@/hooks/useContactos";

// Descarga en CSV todos los leads que coinciden con los filtros activos de
// la tabla (no solo la página visible ni toda la base ciega). La descarga
// se dispara al hacer clic: recién ahí se pide al backend todo lo filtrado
// paginando internamente hasta el final.
export default function LeadsExport({
  filtros,
  total,
}: {
  filtros: FiltrosLeads;
  total: number;
}) {
  const [descargando, setDescargando] = useState(false);
  const { refetch } = useTodosContactos(filtros, false);

  const exportar = async () => {
    setDescargando(true);
    try {
      const { data } = await refetch();
      let base = data ?? [];
      // 'Otros' (texto de proyecto no reconocido) no es expresable en SQL:
      // si está entre los proyectos seleccionados, se afina en cliente.
      if (filtros.proyectos.includes("Otros")) {
        base = base.filter((c) =>
          filtros.proyectos.some((p) => perteneceAProyecto(c, p))
        );
      }
      const fecha = new Date().toISOString().slice(0, 10);
      const partes = ["leads"];
      if (filtros.estados.length) partes.push(filtros.estados.join("-"));
      if (filtros.proyectos.length)
        partes.push(filtros.proyectos.map((p) => p.replace(/[^\w-]+/g, "-").toLowerCase()).join("-"));
      if (filtros.rango?.desde || filtros.rango?.hasta)
        partes.push(`${filtros.rango?.desde || "inicio"}_a_${filtros.rango?.hasta || "hoy"}`);
      descargarCSV(`${partes.join("_")}_${fecha}.csv`, COLUMNAS_CSV, filasCSV(base));
    } finally {
      setDescargando(false);
    }
  };

  return (
    <button
      onClick={exportar}
      disabled={descargando || total === 0}
      className="flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#029676] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      {descargando ? "Preparando..." : `Descargar CSV${total > 0 ? ` (${total.toLocaleString("es-PE")})` : ""}`}
    </button>
  );
}
