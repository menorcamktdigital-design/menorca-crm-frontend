"use client";

import {
  colorCanal,
  entero,
  mesCorto,
  porcentaje,
  totalesWeb,
  type Web,
} from "@/lib/funnel";

const ALTO_GRAFICO = 90;

// Cómo le va a la web, de cualquier origen. Los totales salen de mkt_ga4_sitio
// (sin desglose por página), así que cuadran con la interfaz de GA4: la tabla por
// página cuenta una misma sesión en cada página visitada y sumarla infla ~24%.
export default function WebCard({
  web,
  cargando,
  error,
}: {
  web?: Web;
  cargando: boolean;
  error?: boolean;
}) {
  const meses = web?.meses ?? [];
  const canales = web?.canales ?? [];

  const t = totalesWeb(meses);
  const maxSesiones = Math.max(...meses.map((m) => m.sesiones), 1);
  const pctNuevos = t.usuarios > 0 ? t.nuevos_usuarios / t.usuarios : 0;
  const pctGoogleAds = t.sesiones > 0 ? t.sesiones_google_ads / t.sesiones : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-baseline justify-between px-5 py-4">
        <h2 className="text-sm font-bold text-gray-900">Tráfico de la web</h2>
        <p className="text-[11px] text-gray-400">Todo el sitio · cualquier origen</p>
      </div>

      {error ? (
        <p className="px-5 pb-5 text-sm text-red-500">No se pudieron cargar los datos.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-y border-gray-100 md:grid-cols-4">
            <Tile label="Sesiones" valor={cargando ? "—" : entero(t.sesiones)} />
            <Tile label="Usuarios" valor={cargando ? "—" : entero(t.usuarios)} />
            <Tile
              label="Desde Google Ads"
              valor={cargando ? "—" : porcentaje(pctGoogleAds)}
              nota={cargando ? undefined : `${entero(t.sesiones_google_ads)} sesiones`}
            />
            <Tile
              label="Rebote"
              valor={cargando ? "—" : porcentaje(t.rebote)}
              nota="entran y se van sin interactuar"
            />
          </div>

          {canales.length > 0 && (
            <div className="px-5 py-4">
              <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-wide text-gray-400">
                  De dónde viene el tráfico
                </span>
                <span className="text-gray-500">
                  {porcentaje(pctNuevos)} de los usuarios son nuevos
                </span>
              </div>

              <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                {canales.map((c) => (
                  <div
                    key={c.canal}
                    className={colorCanal(c.canal)}
                    style={{ width: `${(c.sesiones / Math.max(t.sesiones, 1)) * 100}%` }}
                    title={`${c.canal}: ${entero(c.sesiones)} sesiones`}
                  />
                ))}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                {canales.map((c) => (
                  <span key={c.canal} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${colorCanal(c.canal)}`} />
                    {c.canal}:{" "}
                    <span className="font-medium tabular-nums">{entero(c.sesiones)}</span>
                  </span>
                ))}
              </div>

              <p className="mt-2.5 text-[11px] text-gray-400">
                Paid Search y Cross-network son las campañas de Google Ads
                (Cross-network es Performance Max). El embudo de arriba mide solo esas.
              </p>
            </div>
          )}

          {meses.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Sesiones por mes
              </p>
              {/* La altura va en píxeles, no en %: un hijo con height en porcentaje
                  necesita que el padre tenga altura definida, y con flex-1 no la
                  tiene, así que las barras salían con altura cero. */}
              <div className="flex items-end gap-1.5">
                {meses.map((m) => (
                  <div key={m.mes} className="group flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
                      {entero(m.sesiones)}
                    </span>
                    <div
                      className="w-full rounded-t bg-blue-500/70 transition-colors group-hover:bg-blue-500"
                      style={{
                        height: `${Math.max((m.sesiones / maxSesiones) * ALTO_GRAFICO, 2)}px`,
                      }}
                      title={`${mesCorto(m.mes)}: ${entero(m.sesiones)} sesiones`}
                    />
                    <span className="text-[10px] text-gray-400">
                      {mesCorto(m.mes).split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Tile({ label, valor, nota }: { label: string; valor: string; nota?: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{valor}</p>
      {nota && <p className="mt-0.5 text-[11px] text-gray-400">{nota}</p>}
    </div>
  );
}
