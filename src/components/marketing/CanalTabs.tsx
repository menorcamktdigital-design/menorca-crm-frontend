"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Pestañas de canal compartidas entre las vistas de marketing: cada canal
// de captación es una página propia.
const CANALES = [
  { href: "/marketing", label: "WhatsApp · Meta" },
  { href: "/formularios", label: "Forms · Meta" },
  { href: "/formularios-tiktok", label: "Forms · TikTok" },
  { href: "/formularios-web", label: "Forms · Web" },
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
    </div>
  );
}
