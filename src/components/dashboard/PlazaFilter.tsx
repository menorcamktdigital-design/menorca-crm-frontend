"use client";

import SearchSelect from "@/components/ui/SearchSelect";

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
    <SearchSelect
      className="w-60"
      valor={valor}
      onChange={onChange}
      opciones={[
        { value: "todas", label: "Todas las plazas" },
        ...plazas.map((p) => ({ value: p, label: p })),
      ]}
    />
  );
}
