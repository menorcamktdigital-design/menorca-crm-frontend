"use client";

import { useEffect, useMemo, useState } from "react";
import { useVisitas, fechaDeVisita } from "@/hooks/useVisitas";
import { useModalStore } from "@/store/modalStore";
import { claveDiaLima, formatHora } from "@/lib/fecha";
import { perteneceAProyecto, proyectosDe, PROYECTOS, SIN_PROYECTO } from "@/lib/proyectos";
import Avatar from "@/components/ui/Avatar";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import FichaContacto from "@/components/leads/FichaContacto";
import type { Visita } from "@/types";

const PLAZAS = [...PROYECTOS, SIN_PROYECTO];
// La selección de plazas se recuerda por navegador: cada asesor elige sus
// plazas una vez y al volver a entrar ve solo sus visitas.
const STORAGE_KEY = "visitas_plazas";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Celdas del mes en curso: null = hueco antes del día 1 (la semana
// empieza en lunes, como los calendarios locales)
function celdasDelMes(anio: number, mes: number): (number | null)[] {
  const primerDia = new Date(anio, mes, 1).getDay(); // 0=Dom
  const huecos = (primerDia + 6) % 7; // lunes como inicio
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  return [
    ...Array.from({ length: huecos }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
}

const claveDia = (anio: number, mes: number, dia: number) =>
  `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

export default function VisitasPage() {
  const { data, isLoading, isError } = useVisitas();
  const showModal = useModalStore((s) => s.showModal);

  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [plazas, setPlazas] = useState<string[]>([]);

  // Carga la selección guardada al montar (localStorage no existe en SSR)
  useEffect(() => {
    try {
      const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(guardadas)) setPlazas(guardadas.filter((p) => PLAZAS.includes(p)));
    } catch {}
  }, []);

  const cambiarPlazas = (v: string[]) => {
    setPlazas(v);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  };

  const cambiarMes = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };

  // Con plazas seleccionadas solo se ven las visitas de esos proyectos
  // (mismo matching que el resto de filtros: lib/proyectos.ts)
  const visitasFiltradas = useMemo(() => {
    const todas = data ?? [];
    if (plazas.length === 0) return todas;
    return todas.filter((v) => plazas.some((p) => perteneceAProyecto(v, p)));
  }, [data, plazas]);

  // Visitas agrupadas por día (clave YYYY-MM-DD en hora de Perú)
  const porDia = useMemo(() => {
    const mapa = new Map<string, Visita[]>();
    for (const v of visitasFiltradas) {
      const fecha = fechaDeVisita(v);
      if (!fecha) continue;
      const clave = claveDiaLima(fecha);
      const lista = mapa.get(clave) ?? [];
      lista.push(v);
      mapa.set(clave, lista);
    }
    return mapa;
  }, [visitasFiltradas]);

  const celdas = celdasDelMes(anio, mes);
  const claveHoy = claveDiaLima(hoy.toISOString());

  // Para la lista móvil: solo días del mes visible con visitas, descendente
  const diasConVisitas = useMemo(() => {
    const prefijo = `${anio}-${String(mes + 1).padStart(2, "0")}`;
    return [...porDia.entries()]
      .filter(([clave]) => clave.startsWith(prefijo))
      .sort(([a], [b]) => b.localeCompare(a));
  }, [porDia, anio, mes]);

  const totalMes = diasConVisitas.reduce((acc, [, vs]) => acc + vs.length, 0);

  const abrirFicha = (v: Visita) => {
    showModal(<FichaContacto numero={v.numero} />, {
      title: v.nombre || v.numero,
      widthClass: "max-w-md",
    });
  };

  const ChipVisita = ({ v }: { v: Visita }) => (
    <button
      onClick={() => abrirFicha(v)}
      title={`${v.nombre || v.numero} · ${proyectosDe(v).join(", ") || "Sin proyecto"}`}
      className="block w-full truncate rounded bg-blue-50 px-1.5 py-0.5 text-left text-[11px] font-medium text-blue-700 hover:bg-blue-100"
    >
      {v.nombre || v.numero}
    </button>
  );

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Visitas agendadas</h1>
            <p className="text-sm text-gray-500">
              Leads que agendaron visita a un proyecto · {totalMes} este mes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PlazaFilter plazas={PLAZAS} valores={plazas} onChange={cambiarPlazas} />
            <button
              onClick={() => cambiarMes(-1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <span className="min-w-36 text-center text-sm font-semibold text-gray-900">
              {MESES[mes]} {anio}
            </span>
            <button
              onClick={() => cambiarMes(1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            No se pudieron cargar las visitas. Reintentando automáticamente...
          </div>
        )}

        {/* Calendario — desktop/tablet */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] font-semibold tracking-wider text-gray-500 uppercase"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {celdas.map((dia, i) => {
              if (dia === null)
                return <div key={`h${i}`} className="min-h-24 border-b border-r border-gray-100 bg-gray-50/50" />;
              const clave = claveDia(anio, mes, dia);
              const visitas = porDia.get(clave) ?? [];
              const esHoy = clave === claveHoy;
              return (
                <div
                  key={clave}
                  className={`min-h-24 space-y-1 border-b border-r border-gray-100 p-1.5 ${
                    esHoy ? "bg-emerald-50/60" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      esHoy ? "bg-[#00a884] text-white" : "text-gray-500"
                    }`}
                  >
                    {dia}
                  </span>
                  {visitas.slice(0, 3).map((v) => (
                    <ChipVisita key={v.numero} v={v} />
                  ))}
                  {visitas.length > 3 && (
                    <p className="px-1.5 text-[10px] text-gray-400">
                      +{visitas.length - 3} más
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda — móvil: lista de días con visitas */}
        <div className="space-y-3 sm:hidden">
          {isLoading && (
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-400">
              Cargando visitas...
            </p>
          )}
          {!isLoading && diasConVisitas.length === 0 && (
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-400">
              Sin visitas agendadas en {MESES[mes]}.
            </p>
          )}
          {diasConVisitas.map(([clave, visitas]) => {
            const [, m, d] = clave.split("-");
            return (
              <div
                key={clave}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div
                  className={`flex items-center gap-2 border-b border-gray-100 px-4 py-2 ${
                    clave === claveHoy ? "bg-emerald-50" : "bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {Number(d)} de {MESES[Number(m) - 1]}
                  </span>
                  {clave === claveHoy && (
                    <span className="rounded-full bg-[#00a884] px-2 py-0.5 text-[10px] font-medium text-white">
                      Hoy
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {visitas.length} {visitas.length === 1 ? "visita" : "visitas"}
                  </span>
                </div>
                {visitas.map((v) => {
                  const fecha = fechaDeVisita(v);
                  return (
                    <button
                      key={v.numero}
                      onClick={() => abrirFicha(v)}
                      className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-2.5 text-left last:border-0 hover:bg-gray-50"
                    >
                      <Avatar nombre={v.nombre} numero={v.numero} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {v.nombre || v.numero}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {proyectosDe(v).join(", ") || "Sin proyecto"}
                        </p>
                      </div>
                      {fecha && (
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatHora(fecha)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
