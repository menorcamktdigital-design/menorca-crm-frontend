"use client";

import { useState } from "react";
import { useTodosFormulariosTiktok, type FiltrosTiktok } from "@/hooks/useFormulariosTiktok";
import { descargarCSV } from "@/lib/csv";
import { formatFechaHora } from "@/lib/fecha";

const COLUMNAS = [
  { key: "creado_en", label: "Fecha" },
  { key: "nombre", label: "Nombre" },
  { key: "numero", label: "Celular" },
  { key: "email", label: "Email" },
  { key: "proyecto_nombre", label: "Proyecto" },
  { key: "campaign_name", label: "Campaña" },
  { key: "ad_name", label: "Anuncio" },
  { key: "derivado", label: "Derivado" },
];

// Igual que FormulariosExport (Meta) pero sobre /formularios/tiktok: al
// hacer clic se piden todos los leads filtrados, paginando hasta el final.
export default function FormulariosTiktokExport({
  filtros,
  total,
}: {
  filtros: FiltrosTiktok;
  total: number;
}) {
  const [descargando, setDescargando] = useState(false);
  const { refetch } = useTodosFormulariosTiktok(filtros, false);

  const exportar = async () => {
    setDescargando(true);
    try {
      const { data } = await refetch();
      const filas = (data ?? []).map((f) => ({
        creado_en: formatFechaHora(f.creado_en),
        nombre: f.nombre || "",
        numero: f.numero,
        email: f.email || "",
        proyecto_nombre: f.proyecto_nombre || "",
        campaign_name: f.campaign_name || "",
        ad_name: f.ad_name || "",
        derivado: f.derivado ? "Sí" : "No",
      }));
      const fecha = new Date().toISOString().slice(0, 10);
      const partes = ["formularios_tiktok"];
      if (filtros.proyecto) partes.push(filtros.proyecto.replace(/[^\w-]+/g, "-").toLowerCase());
      if (filtros.rango?.desde || filtros.rango?.hasta)
        partes.push(`${filtros.rango?.desde || "inicio"}_a_${filtros.rango?.hasta || "hoy"}`);
      descargarCSV(`${partes.join("_")}_${fecha}.csv`, COLUMNAS, filas);
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
