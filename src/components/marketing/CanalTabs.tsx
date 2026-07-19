"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Pestañas de canal compartidas entre las vistas de marketing: cada canal
// de captación es una página propia. TikTok se habilita cuando n8n guarde
// esos leads con su propio source_type.
const CANALES = [
  { href: "/marketing", label: "WhatsApp · Meta" },
  { href: "/formularios", label: "Forms · Meta" },
];

export default function CanalTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm w-fit">
      {CANALES.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            pathname === c.href
              ? "bg-[#00a884] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {c.label}
        </Link>
      ))}
      <span
        title="Disponible cuando se conecte TikTok Ads"
        className="cursor-not-allowed rounded-lg px-3.5 py-1.5 text-sm font-medium text-gray-300"
      >
        Forms · TikTok
      </span>
    </div>
  );
}
