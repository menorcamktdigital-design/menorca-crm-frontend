"use client";

import { badgeCanal, ESTADOS_CAIDOS } from "@/lib/canal-estilo";
import { sumarMontos } from "@/lib/ventas-agrupar";
import type { VentasHistoricoData } from "@/types";

const n = (v: number) => v.toLocaleString("es-PE");

function Tile({
  label,
  children,
  nota,
}: {
  label: string;
  children: React.ReactNode;
  nota?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="mt-1 text-2xl font-bold text-gray-900">{children}</div>
      {nota && <p className="mt-0.5 text-[11px] text-gray-400">{nota}</p>}
    </div>
  );
}

export default function VentasStatTiles({
  data,
  cargando,
}: {
  data?: VentasHistoricoData;
  cargando: boolean;
}) {
  if (cargando) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="mt-2 h-6 w-10 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const montos = Object.entries(sumarMontos(data.ventas)).filter(([, v]) => v > 0);

  const caidas = data.ventas.filter((v) => ESTADOS_CAIDOS.has(v.estado_contrato));

  const top = data.por_canal[0];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile label="Total ventas">{n(data.total)}</Tile>

      <Tile label="Monto" nota={montos.length > 1 ? "sin convertir entre monedas" : undefined}>
        <span className="flex flex-col leading-tight">
          {montos.length === 0 ? (
            <span className="text-gray-400">—</span>
          ) : (
            montos.map(([moneda, valor]) => (
              <span key={moneda} className="text-lg tabular-nums">
                {moneda} {n(Math.round(valor))}
              </span>
            ))
          )}
        </span>
      </Tile>

      <Tile
        label="Canceladas o resueltas"
        nota={caidas.length > 0 ? "incluidas en el total" : undefined}
      >
        <span className={caidas.length > 0 ? "text-red-600" : "text-gray-900"}>
          {n(caidas.length)}
        </span>
      </Tile>

      <Tile label="Canal principal">
        {top ? (
          <span className="flex flex-col items-start gap-1">
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeCanal(top.canal)}`}>
              {top.canal}
            </span>
            <span className="text-xl">{n(top.total)}</span>
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </Tile>
    </div>
  );
}
