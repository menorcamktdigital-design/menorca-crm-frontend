"use client";

import MultiSearchSelect from "@/components/ui/MultiSearchSelect";

export default function PlazaFilter({
  plazas,
  valores,
  onChange,
}: {
  plazas: string[];
  valores: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <MultiSearchSelect
      className="w-60"
      valores={valores}
      onChange={onChange}
      placeholder="Todas las plazas"
      opciones={plazas.map((p) => ({ value: p, label: p }))}
    />
  );
}
