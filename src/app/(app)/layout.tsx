"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import NavRail from "@/components/layout/NavRail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const hidratado = useAuthStore((s) => s.hidratado);

  useEffect(() => {
    if (hidratado && !usuario) router.replace("/login");
  }, [hidratado, usuario, router]);

  if (!hidratado || !usuario) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-100 text-sm text-gray-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-100">
      <NavRail />
      {/* pb-14 deja espacio para la barra inferior en móvil */}
      <div className="h-full min-w-0 flex-1 pb-14 md:pb-0">{children}</div>
    </div>
  );
}
