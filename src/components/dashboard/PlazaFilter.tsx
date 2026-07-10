"use client";

export default function PlazaFilter({
  plazas,
  valor,
  onChange,
}: {
  plazas: string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#00a884]"
    >
      <option value="todas">Todas las plazas</option>
      {plazas.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
