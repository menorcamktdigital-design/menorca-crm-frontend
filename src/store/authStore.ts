import { create } from "zustand";
import { persist } from "zustand/middleware";

// Auth solo de UI por ahora — sin backend. Cuando exista el endpoint de
// login se reemplaza `login()` por la llamada real y se guarda el token.
export interface Usuario {
  nombre: string;
}

interface AuthState {
  usuario: Usuario | null;
  hidratado: boolean;
  setHidratado: (v: boolean) => void;
  login: (nombre: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      hidratado: false,
      setHidratado: (hidratado) => set({ hidratado }),
      login: (nombre) => set({ usuario: { nombre } }),
      logout: () => set({ usuario: null }),
    }),
    {
      name: "menorca-auth",
      partialize: (s) => ({ usuario: s.usuario }),
      onRehydrateStorage: () => (state) => state?.setHidratado(true),
    }
  )
);
