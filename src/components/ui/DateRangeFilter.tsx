"use client";

import type { RangoFechas } from "@/types";

const INPUT =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-[#00a884] focus:outline-none";

// Par de inputs desde/hasta con botón para limpiar. El filtrado real
// ocurre en el backend (?desde=&hasta=), esto solo guarda el rango.
export default function DateRangeFilter({
  valor,
  onChange,
}: {
  valor: RangoFechas;
  onChange: (v: RangoFechas) => void;
}) {
  const { desde = "", hasta = "" } = valor;
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={desde}
        max={hasta || undefined}
        onChange={(e) => onChange({ desde: e.target.value, hasta })}
        className={INPUT}
        aria-label="Desde"
      />
      <span className="text-sm text-gray-400">–</span>
      <input
        type="date"
        value={hasta}
        min={desde || undefined}
        onChange={(e) => onChange({ desde, hasta: e.target.value })}
        className={INPUT}
        aria-label="Hasta"
      />
      {(desde || hasta) && (
        <button
          onClick={() => onChange({})}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Limpiar fechas"
          title="Limpiar fechas"
        >
          ✕
        </button>
      )}
    </div>
  );
}
