// Genera y descarga un CSV en el navegador (con BOM para que Excel
// reconozca los acentos).
export function descargarCSV(
  nombreArchivo: string,
  columnas: { key: string; label: string }[],
  filas: Record<string, unknown>[]
) {
  const escapar = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lineas = [
    columnas.map((c) => escapar(c.label)).join(","),
    ...filas.map((f) => columnas.map((c) => escapar(f[c.key])).join(",")),
  ];

  const blob = new Blob(["﻿" + lineas.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
