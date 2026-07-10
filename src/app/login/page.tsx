"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { usuario, hidratado, login } = useAuthStore();
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Si ya hay sesión, ir directo al dashboard
  useEffect(() => {
    if (hidratado && usuario) router.replace("/");
  }, [hidratado, usuario, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !password.trim()) {
      setError("Ingresa usuario y contraseña");
      return;
    }
    // Por ahora sin backend: cualquier credencial válida entra.
    login(nombre.trim());
    router.replace("/");
  };

  return (
    <main className="flex h-dvh items-center justify-center bg-[#00a884] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00a884]/10 text-3xl">
            🏠
          </span>
          <h1 className="text-xl font-bold text-gray-900">Agente Menorca</h1>
          <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre de usuario"
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-lg bg-[#00a884] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#029676]"
          >
            Ingresar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          CRM Menorca · acceso interno
        </p>
      </div>
    </main>
  );
}
