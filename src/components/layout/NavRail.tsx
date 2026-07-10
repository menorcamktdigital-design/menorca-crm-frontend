"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
  {
    href: "/conversaciones",
    label: "Conversaciones",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
  },
];

function LogoutIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
      />
    </svg>
  );
}

export default function NavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const cerrarSesion = () => {
    logout();
    router.replace("/login");
  };

  const linkClass = (activo: boolean) =>
    `flex flex-col items-center gap-0.5 rounded-xl p-2.5 transition-colors ${
      activo
        ? "bg-[#00a884]/10 text-[#00a884]"
        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
    }`;

  return (
    <>
      {/* Rail lateral — desktop */}
      <nav className="hidden h-full w-[72px] shrink-0 flex-col items-center gap-2 border-r border-gray-200 bg-white py-4 md:flex">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#00a884] text-xl">
          🏠
        </span>

        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={linkClass(pathname === item.href)}
          >
            {item.icon}
          </Link>
        ))}

        <div className="flex-1" />

        <span
          title={usuario?.nombre}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884]/15 text-sm font-semibold text-[#00a884]"
        >
          {(usuario?.nombre?.[0] || "?").toUpperCase()}
        </span>
        <button
          onClick={cerrarSesion}
          title="Cerrar sesión"
          className="rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <LogoutIcon />
        </button>
      </nav>

      {/* Barra inferior — móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-14 items-center justify-around border-t border-gray-200 bg-white md:hidden">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium ${
              pathname === item.href ? "text-[#00a884]" : "text-gray-400"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        <button
          onClick={cerrarSesion}
          className="flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium text-gray-400"
        >
          <LogoutIcon />
          Salir
        </button>
      </nav>
    </>
  );
}
