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
    href: "/ventas",
    label: "Ventas",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
        />
      </svg>
    ),
  },
  {
    href: "/marketing",
    label: "Marketing",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
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
  {
    href: "/visitas",
    label: "Visitas",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
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

  // /formularios vive dentro de la sección Marketing (pestañas de canal)
  const esActivo = (href: string) =>
    pathname === href || (href === "/marketing" && pathname === "/formularios");

  const linkClass = (activo: boolean) =>
    `flex flex-col items-center gap-0.5 rounded-xl p-2.5 transition-colors ${
      activo
        ? "bg-[#00a884]/10 text-[#00a884]"
        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
    }`;

  return (
    <>
      {/* Rail lateral — desktop */}
      <nav className="hidden h-full w-[84px] shrink-0 flex-col items-center gap-1.5 border-r border-gray-200 bg-white py-4 md:flex">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#00a884] text-xl">
          🏠
        </span>

        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`${linkClass(esActivo(item.href))} w-[72px]`}
          >
            {item.icon}
            <span className="text-[10px] font-medium leading-tight">
              {item.label === "Conversaciones" ? "Chats" : item.label}
            </span>
          </Link>
        ))}

        <div className="flex-1" />

        <Link
          href="/perfil"
          title="Mi cuenta"
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
            pathname === "/perfil"
              ? "bg-[#00a884] text-white"
              : "bg-[#00a884]/15 text-[#00a884] hover:bg-[#00a884]/25"
          }`}
        >
          {(usuario?.nombre?.[0] || "?").toUpperCase()}
        </Link>
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
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
              esActivo(item.href) ? "text-[#00a884]" : "text-gray-400"
            }`}
          >
            {item.icon}
            {item.label === "Conversaciones" ? "Chats" : item.label}
          </Link>
        ))}
        <Link
          href="/perfil"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
            pathname === "/perfil" ? "text-[#00a884]" : "text-gray-400"
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00a884]/15 text-[11px] font-semibold text-[#00a884]">
            {(usuario?.nombre?.[0] || "?").toUpperCase()}
          </span>
          Cuenta
        </Link>
      </nav>
    </>
  );
}
