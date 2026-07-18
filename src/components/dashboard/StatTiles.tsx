import type { ValoresTiles } from "./datos";

function Metric({
  label,
  valor,
  color = "text-gray-900",
  cargando,
}: {
  label: string;
  valor: number;
  color?: string;
  cargando: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-4">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {cargando ? "—" : valor.toLocaleString("es-PE")}
      </p>
    </div>
  );
}

function Badge({ label, valor, color, cargando }: { label: string; valor: number; color: string; cargando: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${color}`}>
      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-sm font-bold">{cargando ? "—" : valor.toLocaleString("es-PE")}</span>
    </div>
  );
}

export default function StatTiles({
  valores,
  cargando,
}: {
  valores?: ValoresTiles;
  cargando: boolean;
}) {
  const ratio =
    valores && valores.leads > 0
      ? ((valores.derivados / valores.leads) * 100).toLocaleString("es-PE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : "0.0";

  return (
    <div className="space-y-2">
      {/* Fila 1 — Origen */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-stretch divide-x divide-gray-100">
          <div className="flex flex-col gap-0.5 px-5 py-4 bg-gray-50 border-r border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total leads</p>
            <p className="text-2xl font-bold text-gray-900">{cargando ? "—" : (valores?.leads ?? 0).toLocaleString("es-PE")}</p>
          </div>

          <Metric label="Meta Ads" valor={valores?.meta_ads ?? 0} color="text-blue-600" cargando={cargando} />
          <Metric label="Directo / orgánico" valor={valores?.directo ?? 0} color="text-gray-700" cargando={cargando} />
          {/* <Metric label="Sin atribuir" valor={valores?.sin_atribuir ?? 0} color="text-gray-400" cargando={cargando} /> */}

          {/* Separador visual */}
          <div className="flex items-center px-5 py-4 gap-3">
            <div className="h-full w-px bg-gray-100" />
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Del total</p>
              <div className="flex gap-2">
                <Badge
                  label="Acelerador"
                  valor={valores?.acelerador ?? 0}
                  color="border-orange-200 bg-orange-50 text-orange-600"
                  cargando={cargando}
                />
                <Badge
                  label="Referidos"
                  valor={valores?.referido ?? 0}
                  color="border-teal-200 bg-teal-50 text-teal-600"
                  cargando={cargando}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2 — Estado */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-stretch divide-x divide-gray-100">
          <Metric label="Conversando" valor={valores?.conversando ?? 0} color="text-amber-500" cargando={cargando} />
          <Metric label="Derivados" valor={valores?.derivados ?? 0} color="text-[#00a884]" cargando={cargando} />
          <div className="flex flex-col gap-0.5 px-5 py-4 bg-gray-50">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Ratio derivación</p>
            <p className="text-2xl font-bold text-[#00a884]">{cargando ? "—" : `${ratio}%`}</p>
          </div>
          <Metric label="Recontactos" valor={valores?.recontactos ?? 0} color="text-orange-500" cargando={cargando} />
          <Metric label="Visitas agendadas" valor={valores?.visitas ?? 0} color="text-blue-600" cargando={cargando} />
          <Metric label="No contesta" valor={valores?.no_contesta ?? 0} color="text-slate-400" cargando={cargando} />
          <Metric label="No interesado" valor={valores?.no_interesado ?? 0} color="text-red-500" cargando={cargando} />
        </div>
      </div>
    </div>
  );
}
