"use client";

import { useState } from "react";
import { entero, soles, type SinPlaza } from "@/lib/funnel";

// Mientras haya campañas o páginas sin plaza, ese gasto y ese tráfico no se
// atribuyen a ningún proyecto y el funnel está incompleto. La alerta existe para
// que el hueco sea visible en vez de quedar diluido dentro de los totales.
export default function SinPlazaAlerta({ datos }: { datos?: SinPlaza }) {
  const [abierto, setAbierto] = useState(false);

  const campanas = datos?.campanas ?? [];
  const paginas = datos?.paginas ?? [];
  if (campanas.length === 0 && paginas.length === 0) return null;

  const inversion = campanas.reduce((s, c) => s + c.inversion, 0);
  const sesiones = paginas.reduce((s, p) => s + p.sesiones, 0);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/25 text-xs font-bold text-amber-700">
            !
          </span>
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Sin plaza asignada:</span>{" "}
            {campanas.length > 0 && (
              <>
                {campanas.length} campaña{campanas.length !== 1 && "s"} ({soles(inversion)})
              </>
            )}
            {campanas.length > 0 && paginas.length > 0 && " · "}
            {paginas.length > 0 && (
              <>
                {paginas.length} página{paginas.length !== 1 && "s"} ({entero(sesiones)} sesiones)
              </>
            )}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-amber-700">
          {abierto ? "Ocultar" : "Ver detalle"}
        </span>
      </button>

      {abierto && (
        <div className="grid grid-cols-1 gap-4 border-t border-amber-200/70 px-5 py-4 md:grid-cols-2">
          <Lista
            titulo="Campañas de Google Ads"
            vacio="Ninguna"
            items={campanas.map((c) => ({
              nombre: c.nombre,
              detalle: `${soles(c.inversion)} · ${entero(c.clics)} clics`,
            }))}
            ayuda="El nombre no empieza con un código de plaza conocido."
          />
          <Lista
            titulo="Páginas del sitio"
            vacio="Ninguna"
            items={paginas.map((p) => ({
              nombre: p.nombre,
              detalle: `${entero(p.sesiones)} sesiones`,
            }))}
            ayuda="El slug de la URL no está en el mapeo de GA4."
          />
        </div>
      )}
    </div>
  );
}

function Lista({
  titulo,
  items,
  vacio,
  ayuda,
}: {
  titulo: string;
  items: { nombre: string; detalle: string }[];
  vacio: string;
  ayuda: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
        {titulo}
      </p>
      <p className="mb-2 text-[11px] text-amber-600/80">{ayuda}</p>
      {items.length === 0 ? (
        <p className="text-sm text-amber-700/60">{vacio}</p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {items.map((it) => (
            <li
              key={it.nombre}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="truncate text-amber-900" title={it.nombre}>
                {it.nombre}
              </span>
              <span className="shrink-0 tabular-nums text-[11px] text-amber-700">
                {it.detalle}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
