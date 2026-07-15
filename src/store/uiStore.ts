import { create } from "zustand";

type Tab = "chats" | "leads";

interface UIState {
  tab: Tab;
  setTab: (tab: Tab) => void;

  numeroActivo: string | null;
  setNumeroActivo: (numero: string | null) => void;

  busqueda: string;
  setBusqueda: (q: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  tab: "chats",
  setTab: (tab) => set({ tab }),

  numeroActivo: null,
  setNumeroActivo: (numeroActivo) => set({ numeroActivo }),

  busqueda: "",
  setBusqueda: (busqueda) => set({ busqueda }),
}));
