import type { Contacto } from "@/types";
import { normalizarEstado } from "./chartTheme";

export default function StatTiles({
  contactos,
  cargando,
}: {
  contactos: Contacto[];
  cargando: boolean;
}) {
  const conteo = (estado: string) =>
    contactos.filter((c) => normalizarEstado(c.estado) === estado).length;

  const tiles = [
    { label: "Leads", valor: contactos.length, color: "text-gray-900" },
    { label: "Conversando", valor: conteo("en_conversacion"), color: "text-amber-600" },
    { label: "Derivados", valor: conteo("derivado"), color: "text-[#00a884]" },
    { label: "Visitas agendadas", valor: conteo("visita_agendada"), color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{t.label}</p>
          <p className={`mt-1 text-3xl font-bold ${t.color}`}>
            {cargando ? "—" : t.valor.toLocaleString("es-PE")}
          </p>
        </div>
      ))}
    </div>
  );
}
