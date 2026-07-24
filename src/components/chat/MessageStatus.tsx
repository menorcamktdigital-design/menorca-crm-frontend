import type { EstadoEntrega } from "@/types";

const TITULOS: Record<EstadoEntrega, string> = {
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
  failed: "No entregado",
};

export default function MessageStatus({
  estado,
}: {
  estado?: EstadoEntrega | null;
}) {
  if (!estado) return null;

  if (estado === "failed") {
    return (
      <span
        title={TITULOS.failed}
        className="inline-flex items-center text-red-500"
        aria-label={TITULOS.failed}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </span>
    );
  }

  const doble = estado === "delivered" || estado === "read";
  const color = estado === "read" ? "#53bdeb" : "#8696a0";

  return (
    <span
      title={TITULOS[estado]}
      className="inline-flex items-center"
      style={{ color }}
      aria-label={TITULOS[estado]}
    >
      {doble ? (
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none" aria-hidden>
          <path
            d="M1 6l3.2 3.2L9.5 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.3 6l3.2 3.2L15 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
          <path
            d="M1 6l3.5 3.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
