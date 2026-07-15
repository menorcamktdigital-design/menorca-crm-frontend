"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTodosContactos } from "@/hooks/useTodosContactos";
import { descargarCSV } from "@/lib/csv";
import { COLUMNAS_CSV, coincideEstado, filasCSV } from "@/lib/leads";
import { listaProyectos, perteneceAProyecto } from "@/lib/proyectos";
import SearchSelect from "@/components/ui/SearchSelect";

const ESTADOS = [
  { id: "todos", label: "Todos" },
  { id: "en_conversacion", label: "Conversando" },
  { id: "recontacto", label: "Recontactos" },
  { id: "derivado", label: "Derivados" },
  { id: "visita_agendada", label: "Visita agendada" },
];

export default function LeadsExport() {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState("todos");
  const [proyecto, setProyecto] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // La base completa se descarga recién al abrir el panel (enabled)
  const { data: contactos = [], isLoading } = useTodosContactos(abierto);

  // Cerrar al hacer clic fuera
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  // Lista oficial de proyectos + "Otros" / "Sin proyecto" si aplican
  const proyectos = useMemo(() => listaProyectos(contactos), [contactos]);

  const filtrados = useMemo(() => {
    const tDesde = desde ? new Date(`${desde}T00:00:00`).getTime() : null;
    const tHasta = hasta ? new Date(`${hasta}T23:59:59.999`).getTime() : null;
    return contactos.filter((c) => {
      if (!coincideEstado(c, estado)) return false;
      if (proyecto !== "todos" && !perteneceAProyecto(c, proyecto)) return false;
      if (tDesde || tHasta) {
        if (!c.ultima_actividad) return false;
        const t = new Date(c.ultima_actividad).getTime();
        if (tDesde && t < tDesde) return false;
        if (tHasta && t > tHasta) return false;
      }
      return true;
    });
  }, [contactos, estado, proyecto, desde, hasta]);

  const exportar = () => {
    const partes = ["leads"];
    if (estado !== "todos")
      partes.push(ESTADOS.find((e) => e.id === estado)!.label.replace(/\s+/g, "-").toLowerCase());
    if (proyecto !== "todos")
      partes.push(proyecto.replace(/[^\w-]+/g, "-").toLowerCase());
    if (desde || hasta) partes.push(`${desde || "inicio"}_a_${hasta || "hoy"}`);
    descargarCSV(`${partes.join("_")}.csv`, COLUMNAS_CSV, filasCSV(filtrados));
    setAbierto(false);
  };

  const selectClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00a884] focus:outline-none";

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#029676]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Descargar CSV
      </button>

      {abierto && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Exportar leads</h3>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className={selectClass}>
                {ESTADOS.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Proyecto</label>
              <SearchSelect
                valor={proyecto}
                onChange={setProyecto}
                opciones={[
                  { value: "todos", label: "Todos" },
                  ...proyectos.map((p) => ({ value: p, label: p })),
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Desde</label>
                <input
                  type="date"
                  value={desde}
                  max={hasta || undefined}
                  onChange={(e) => setDesde(e.target.value)}
                  className={selectClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  min={desde || undefined}
                  onChange={(e) => setHasta(e.target.value)}
                  className={selectClass}
                />
              </div>
            </div>
          </div>

          <button
            onClick={exportar}
            disabled={isLoading || filtrados.length === 0}
            className="mt-4 w-full rounded-lg bg-[#00a884] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#029676] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Cargando base..."
              : filtrados.length === 0
                ? "Sin resultados"
                : `Descargar ${filtrados.length} lead${filtrados.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </div>
  );
}
