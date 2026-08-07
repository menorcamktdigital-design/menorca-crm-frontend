"use client";

import {
  cpcReal,
  ctrReal,
  entero,
  porcentaje,
  soles,
  solesUnitario,
  type FilaFunnel,
} from "@/lib/funnel";

// Etapas del embudo. Las dos últimas todavía no tienen fuente conectada
// (Sperant), pero se muestran en gris para que el recorrido completo quede a la
// vista y se note qué falta en vez de dar la impresión de que el funnel termina
// en las sesiones.
type Etapa = {
  label: string;
  valor: number | null;
  formato: (v: number) => string;
  color: string;
  nota?: string;
};

function Barra({
  etapa,
  max,
  anterior,
}: {
  etapa: Etapa;
  max: number;
  anterior: number | null;
}) {
  const valor = etapa.valor;
  const ancho = valor === null || max <= 0 ? 0 : Math.max((valor / max) * 100, 1.5);

  // Las últimas etapas son miles de veces más chicas que las impresiones, así que
  // su barra queda en el mínimo y no dice nada. El porcentaje respecto a la etapa
  // anterior es lo que realmente se lee en un embudo: cuánto pasa de un paso al
  // siguiente.
  const paso =
    valor !== null && anterior !== null && anterior > 0 ? valor / anterior : null;

  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-right">
        <p className="truncate font-mono text-[11px] font-medium text-gray-500">
          {etapa.label}
        </p>
      </div>

      <div className="h-9 flex-1 overflow-hidden rounded-lg bg-gray-100">
        {valor !== null && (
          <div
            className={`h-full rounded-lg ${etapa.color} transition-[width] duration-500`}
            style={{ width: `${ancho}%` }}
          />
        )}
      </div>

      <div className="flex w-36 shrink-0 items-baseline gap-1.5">
        {valor === null ? (
          <span className="text-sm font-medium text-gray-300">Sin conectar</span>
        ) : (
          <>
            <span className="text-sm font-bold tabular-nums text-gray-900">
              {etapa.formato(valor)}
            </span>
            {paso !== null && (
              <span className="text-[11px] tabular-nums text-gray-400">
                {(paso * 100).toLocaleString("es-PE", {
                  minimumFractionDigits: paso < 0.01 ? 2 : 1,
                  maximumFractionDigits: paso < 0.01 ? 2 : 1,
                })}
                %
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function EmbudoCard({
  total,
  cargando,
}: {
  total: FilaFunnel;
  cargando: boolean;
}) {
  // La inversión no es una etapa del embudo: está en soles y las demás en
  // unidades, así que su barra siempre saldría al 100% sin comparar nada.
  // Va arriba como cabecera y las barras comparten una sola escala real.
  // Los eventos se muestran con su nombre de GA4 tal cual, sin agruparlos en un
  // "leads" calculado: así lo que se ve en el dashboard es lo mismo que se busca
  // en Analytics, sin tener que traducir.
  const etapas: Etapa[] = [
    { label: "Impresiones", valor: total.impresiones, formato: entero, color: "bg-[#00a884]/80" },
    { label: "Clics", valor: total.clics, formato: entero, color: "bg-[#00a884]/60" },
    { label: "Sesiones", valor: total.sesiones, formato: entero, color: "bg-blue-500/70" },
    { label: "form_start", valor: total.form_start, formato: entero, color: "bg-blue-500/50" },
    { label: "form_send", valor: total.form_send, formato: entero, color: "bg-amber-500/80" },
    { label: "send_whatsapp", valor: total.whatsapp, formato: entero, color: "bg-amber-500/60" },
    { label: "maps_click", valor: total.maps_click, formato: entero, color: "bg-amber-500/40" },
    { label: "Derivados", valor: null, formato: entero, color: "bg-gray-300" },
    { label: "Ventas", valor: null, formato: entero, color: "bg-gray-300" },
  ];

  const maxVolumen = Math.max(total.impresiones, total.clics, total.sesiones, 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-gray-900">Embudo</h2>
        <p className="text-[11px] text-gray-400">
          Solo lo que vino de anuncios de Google · sin orgánico ni directo
        </p>
      </div>

      <div className="mb-4 flex items-baseline gap-3 border-b border-gray-100 pb-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Inversión
        </span>
        <span className="text-2xl font-bold text-[#00a884]">
          {cargando ? "—" : soles(total.inversion)}
        </span>
        <span className="text-[11px] text-gray-400">en Google Ads</span>
      </div>

      {cargando ? (
        <div className="space-y-2.5">
          {etapas.map((e) => (
            <div key={e.label} className="h-9 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {etapas.map((e, i) => (
            <Barra
              key={e.label}
              etapa={e}
              max={maxVolumen}
              anterior={i > 0 ? etapas[i - 1].valor : null}
            />
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <Chip label="CTR" valor={cargando ? "—" : porcentaje(ctrReal(total))} />
        <Chip label="CPC" valor={cargando ? "—" : solesUnitario(cpcReal(total))} />
        <Chip
          label="Conversiones Google"
          valor={cargando ? "—" : entero(Math.round(total.conversiones))}
        />
        {/* No se muestra el número de campañas: `campanas` viene contado por mes,
            así que sumarlo cuenta varias veces la que estuvo activa varios meses.
            El total real de campañas distintas lo da la tabla de más abajo. */}
      </div>
    </div>
  );
}

function Chip({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-sm font-bold text-gray-900">{valor}</span>
    </div>
  );
}
