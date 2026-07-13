"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Opcion = { value: string; label: string };

// Búsqueda insensible a acentos ("carabayllo" encuentra "Carabayllo")
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function SearchSelect({
  opciones,
  valor,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
}: {
  opciones: Opcion[];
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resaltado, setResaltado] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const seleccionada = opciones.find((o) => o.value === valor);

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return opciones;
    return opciones.filter((o) => normalizar(o.label).includes(q));
  }, [opciones, busqueda]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  // Al abrir: limpiar búsqueda, foco al input y resaltar la opción actual
  useEffect(() => {
    if (!abierto) return;
    setBusqueda("");
    setResaltado(Math.max(0, opciones.findIndex((o) => o.value === valor)));
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => setResaltado(0), [busqueda]);

  // Mantener visible la opción resaltada al navegar con teclado
  useEffect(() => {
    listaRef.current?.children[resaltado]?.scrollIntoView({ block: "nearest" });
  }, [resaltado]);

  const elegir = (o: Opcion) => {
    onChange(o.value);
    setAbierto(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!abierto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setResaltado((i) => Math.min(i + 1, filtradas.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setResaltado((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtradas[resaltado]) elegir(filtradas[resaltado]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  };

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00a884] focus:outline-none"
      >
        <span className={`truncate ${seleccionada ? "" : "text-gray-400"}`}>
          {seleccionada?.label || placeholder}
        </span>
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
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
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
          </div>

          <ul ref={listaRef} className="max-h-60 overflow-y-auto py-1">
            {filtradas.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
            )}
            {filtradas.map((o, i) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => elegir(o)}
                  onMouseEnter={() => setResaltado(i)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                    i === resaltado ? "bg-emerald-50 text-gray-900" : "text-gray-700"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === valor && (
                    <svg
                      className="h-4 w-4 shrink-0 text-[#00a884]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
