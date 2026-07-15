"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Opcion } from "./SearchSelect";

// Búsqueda insensible a acentos ("carabayllo" encuentra "Carabayllo")
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Variante de SearchSelect con selección múltiple: el valor es un array de
// values (vacío = "todos", igual semántica que el "todos"/"todas" que ya
// usan los selects simples de este dashboard). El dropdown queda abierto
// tras cada elección para poder marcar varias sin reabrir.
export default function MultiSearchSelect({
  opciones,
  valores,
  onChange,
  placeholder = "Todos",
  className = "",
}: {
  opciones: Opcion[];
  valores: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return opciones;
    return opciones.filter((o) => normalizar(o.label).includes(q));
  }, [opciones, busqueda]);

  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    setBusqueda("");
    inputRef.current?.focus();
  }, [abierto]);

  const toggle = (value: string) => {
    if (valores.includes(value)) onChange(valores.filter((v) => v !== value));
    else onChange([...valores, value]);
  };

  const etiqueta =
    valores.length === 0
      ? placeholder
      : valores.length === 1
        ? opciones.find((o) => o.value === valores[0])?.label || placeholder
        : `${valores.length} seleccionados`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00a884] focus:outline-none"
      >
        <span className={`truncate ${valores.length ? "" : "text-gray-400"}`}>{etiqueta}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${abierto ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute left-0 z-30 mt-1 w-full min-w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-2">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400"
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
                ref={inputRef}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-md bg-gray-100 py-1.5 pr-2 pl-8 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            {valores.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                Limpiar
              </button>
            )}
          </div>

          <ul className="max-h-60 overflow-y-auto py-1">
            {filtradas.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
            )}
            {filtradas.map((o) => {
              const marcado = valores.includes(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      marcado ? "bg-emerald-50 text-gray-900" : "text-gray-700"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        marcado ? "border-[#00a884] bg-[#00a884]" : "border-gray-300"
                      }`}
                    >
                      {marcado && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{o.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
