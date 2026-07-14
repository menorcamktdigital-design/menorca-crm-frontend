"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RangoFechas } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");
const aClave = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseClave = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const hoy = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const sumarDias = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const inicioMes = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

interface Preset {
  label: string;
  rango: () => RangoFechas;
}

const PRESETS: Preset[] = [
  { label: "Hoy", rango: () => ({ desde: aClave(hoy()), hasta: aClave(hoy()) }) },
  { label: "Ayer", rango: () => ({ desde: aClave(sumarDias(hoy(), -1)), hasta: aClave(sumarDias(hoy(), -1)) }) },
  { label: "Últimos 7 días", rango: () => ({ desde: aClave(sumarDias(hoy(), -6)), hasta: aClave(hoy()) }) },
  { label: "Últimos 14 días", rango: () => ({ desde: aClave(sumarDias(hoy(), -13)), hasta: aClave(hoy()) }) },
  { label: "Últimos 30 días", rango: () => ({ desde: aClave(sumarDias(hoy(), -29)), hasta: aClave(hoy()) }) },
  { label: "Este mes", rango: () => ({ desde: aClave(inicioMes(hoy())), hasta: aClave(hoy()) }) },
  {
    label: "Mes pasado",
    rango: () => {
      const finMesPasado = sumarDias(inicioMes(hoy()), -1);
      return { desde: aClave(inicioMes(finMesPasado)), hasta: aClave(finMesPasado) };
    },
  },
];

// Calendario de un mes con selección de rango (clic inicio, clic fin;
// hover previsualiza el tramo mientras se elige el segundo extremo)
function Mes({
  mes,
  desde,
  hasta,
  hoverClave,
  onHover,
  onPick,
}: {
  mes: Date;
  desde: Date | null;
  hasta: Date | null;
  hoverClave: string | null;
  onHover: (clave: string | null) => void;
  onPick: (clave: string) => void;
}) {
  const primerDia = inicioMes(mes);
  // Semana empieza en lunes: 0=lunes … 6=domingo
  const offset = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
  ];
  const t = hoy();

  const finPreview = hasta ?? (hoverClave ? parseClave(hoverClave) : null);
  const rangoDesde = desde && finPreview ? (desde < finPreview ? desde : finPreview) : desde;
  const rangoHasta = desde && finPreview ? (desde < finPreview ? finPreview : desde) : null;

  return (
    <div className="w-64">
      <p className="mb-2 text-center text-sm font-semibold text-gray-800">
        {MESES[mes.getMonth()]} {mes.getFullYear()}
      </p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-medium text-gray-400">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {celdas.map((d, i) => {
          if (!d) return <span key={i} />;
          const clave = aClave(d);
          const esDesde = desde && mismoDia(d, desde);
          const esHasta = hasta && mismoDia(d, hasta);
          const enRango = rangoDesde && rangoHasta && d > rangoDesde && d < rangoHasta;
          const esHoy = mismoDia(d, t);
          const extremo = esDesde || esHasta;

          return (
            <div key={clave} className="relative flex justify-center py-0.5">
              {enRango && <span className="absolute inset-y-0 -inset-x-[1px] bg-[#00a884]/10" />}
              {esDesde && rangoHasta && !mismoDia(d, rangoHasta) && (
                <span className="absolute inset-y-0 right-0 left-1/2 bg-[#00a884]/10" />
              )}
              {esHasta && rangoDesde && !mismoDia(d, rangoDesde) && (
                <span className="absolute inset-y-0 right-1/2 left-0 bg-[#00a884]/10" />
              )}
              <button
                type="button"
                onClick={() => onPick(clave)}
                onMouseEnter={() => onHover(clave)}
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                  extremo
                    ? "bg-[#00a884] font-semibold text-white"
                    : esHoy
                      ? "font-semibold text-[#00a884] hover:bg-gray-100"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Selector de rango de fechas con presets (fila izquierda) y doble
// calendario (derecha) en un popover — reemplaza los <input type="date">
// nativos. El filtrado real sigue ocurriendo en el backend (?desde=&hasta=).
export default function DateRangeFilter({
  valor,
  onChange,
}: {
  valor: RangoFechas;
  onChange: (v: RangoFechas) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(() => inicioMes(hoy()));
  const [seleccionando, setSeleccionando] = useState<RangoFechas>({});
  const [hoverClave, setHoverClave] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del popover
  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  // Sincroniza el estado del popover con el valor externo justo al abrirlo
  // (evento de usuario, no un efecto reactivo al valor de `abierto`)
  const abrir = () => {
    setSeleccionando(valor);
    setHoverClave(null);
    setMesVisible(inicioMes(valor.desde ? parseClave(valor.desde) : hoy()));
    setAbierto(true);
  };

  const desdeDate = seleccionando.desde ? parseClave(seleccionando.desde) : null;
  const hastaDate = seleccionando.hasta ? parseClave(seleccionando.hasta) : null;

  const presetActivo = useMemo(
    () => PRESETS.find((p) => {
      const r = p.rango();
      return r.desde === valor.desde && r.hasta === valor.hasta;
    })?.label ?? null,
    [valor]
  );

  const pick = (clave: string) => {
    if (!seleccionando.desde || (seleccionando.desde && seleccionando.hasta)) {
      setSeleccionando({ desde: clave, hasta: undefined });
      return;
    }
    const d = parseClave(seleccionando.desde);
    const c = parseClave(clave);
    setSeleccionando(
      c < d ? { desde: clave, hasta: seleccionando.desde } : { desde: seleccionando.desde, hasta: clave }
    );
  };

  const aplicar = () => {
    onChange(seleccionando);
    setAbierto(false);
  };

  const limpiar = () => {
    onChange({});
    setAbierto(false);
  };

  const mesSiguiente = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1);

  const etiquetaBoton = presetActivo
    ? presetActivo
    : valor.desde || valor.hasta
      ? `${valor.desde ?? "…"} – ${valor.hasta ?? "…"}`
      : "Todo el periodo";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-300 focus:border-[#00a884] focus:outline-none"
      >
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <span className="max-w-[12rem] truncate">{etiquetaBoton}</span>
        {(valor.desde || valor.hasta) && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange({});
            }}
            className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Limpiar fechas"
            title="Limpiar fechas"
          >
            ✕
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-30 mt-1.5 flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Presets */}
          <div className="w-40 shrink-0 border-r border-gray-100 py-2">
            {PRESETS.map((p) => {
              const activo = presetActivo === p.label;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    onChange(p.rango());
                    setAbierto(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm ${
                    activo ? "bg-[#00a884]/10 font-medium text-[#00a884]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                  {activo && (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
            <div className="mx-3 my-2 border-t border-gray-100" />
            <button
              type="button"
              onClick={limpiar}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50"
            >
              Todo el periodo
            </button>
          </div>

          {/* Calendario doble */}
          <div className="p-4" onMouseLeave={() => setHoverClave(null)}>
            <div className="mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Mes anterior"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-xs text-gray-400">Selecciona inicio y fin</span>
              <button
                type="button"
                onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Mes siguiente"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            <div className="flex gap-4">
              <Mes mes={mesVisible} desde={desdeDate} hasta={hastaDate} hoverClave={hoverClave} onHover={setHoverClave} onPick={pick} />
              <div className="border-l border-gray-100" />
              <Mes mes={mesSiguiente} desde={desdeDate} hasta={hastaDate} hoverClave={hoverClave} onHover={setHoverClave} onPick={pick} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-500">
                {seleccionando.desde ? seleccionando.desde : "Desde…"}
                {" – "}
                {seleccionando.hasta ? seleccionando.hasta : "Hasta…"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={aplicar}
                  disabled={!seleccionando.desde}
                  className="rounded-lg bg-[#00a884] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#009677] disabled:opacity-40"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
