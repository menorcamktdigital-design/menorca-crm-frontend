// Estados comunes de las tarjetas de marketing: skeleton mientras carga,
// error (los endpoints reintentan solos) y vacío cuando el filtro no trae
// filas. Si hay datos, renderiza children.
export default function EstadoDatos({
  cargando,
  error,
  vacio,
  children,
}: {
  cargando: boolean;
  error: boolean;
  vacio: boolean;
  children: React.ReactNode;
}) {
  if (cargando) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-3/4 rounded bg-gray-100" />
        <div className="h-4 w-1/2 rounded bg-gray-100" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No se pudieron cargar los datos. Reintentando automáticamente...
      </p>
    );
  }
  if (vacio) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Sin datos para el filtro seleccionado
      </p>
    );
  }
  return <>{children}</>;
}
