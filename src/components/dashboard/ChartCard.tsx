export default function ChartCard({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
      {subtitulo && <p className="mt-0.5 text-xs text-gray-500">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
