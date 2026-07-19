"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#00a884]";

// Perfil de la cuenta. Por ahora los datos viven solo en el navegador
// (authStore persistido en localStorage); cuando exista el login real con
// backend, este formulario pasa a leer/guardar contra ese endpoint.
export default function PerfilPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const actualizarPerfil = useAuthStore((s) => s.actualizarPerfil);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [correo, setCorreo] = useState(usuario?.correo ?? "");
  const [guardado, setGuardado] = useState(false);

  const guardar = () => {
    if (!nombre.trim()) return;
    actualizarPerfil({ nombre: nombre.trim(), correo: correo.trim() || undefined });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const cerrarSesion = () => {
    logout();
    router.replace("/login");
  };

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-xl font-bold text-gray-900">Mi cuenta</h1>
        <p className="mb-5 text-sm text-gray-500">
          Datos del perfil de esta sesión
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00a884]/15 text-xl font-semibold text-[#00a884]">
              {(nombre?.[0] || "?").toUpperCase()}
            </span>
            <div>
              <p className="font-semibold text-gray-900">{usuario?.nombre || "Sin nombre"}</p>
              <p className="text-sm text-gray-500">{usuario?.correo || "Sin correo"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Correo
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@menorca.com.pe"
                className={INPUT}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={guardar}
                disabled={!nombre.trim()}
                className="rounded-lg bg-[#00a884] px-4 py-2 text-sm font-medium text-white hover:bg-[#009073] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Guardar cambios
              </button>
              {guardado && (
                <span className="text-sm text-emerald-600">Guardado ✓</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={cerrarSesion}
          className="mt-4 w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
