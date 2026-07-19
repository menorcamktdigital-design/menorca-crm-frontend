import { create } from "zustand";
import { persist } from "zustand/middleware";

// Auth solo de UI por ahora — sin backend. Cuando exista el endpoint de
// login se reemplaza `login()` por la llamada real y se guarda el token.
export interface Usuario {
  nombre: string;
  correo?: string;
}

// Cookie que lee src/proxy.ts para proteger rutas en el servidor.
// Al no haber backend es solo un flag de sesión, no un token verificable.
const SESSION_COOKIE = "menorca_session";

function setSessionCookie(activa: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = activa
    ? `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : `${SESSION_COOKIE}=; path=/; max-age=0`;
}

interface AuthState {
  usuario: Usuario | null;
  hidratado: boolean;
  setHidratado: (v: boolean) => void;
  login: (nombre: string) => void;
  logout: () => void;
  actualizarPerfil: (datos: Partial<Usuario>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      hidratado: false,
      setHidratado: (hidratado) => set({ hidratado }),
      login: (nombre) => {
        setSessionCookie(true);
        set({ usuario: { nombre } });
      },
      logout: () => {
        setSessionCookie(false);
        set({ usuario: null });
      },
      actualizarPerfil: (datos) =>
        set((s) => (s.usuario ? { usuario: { ...s.usuario, ...datos } } : s)),
    }),
    {
      name: "menorca-auth",
      partialize: (s) => ({ usuario: s.usuario }),
      onRehydrateStorage: () => (state) => {
        // Sincroniza la cookie con sesiones ya guardadas en localStorage
        if (state?.usuario) setSessionCookie(true);
        state?.setHidratado(true);
      },
    }
  )
);
