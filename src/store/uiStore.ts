import { create } from "zustand";

type Tab = "chats" | "leads";

export type FiltroLead = "todos" | "en_conversacion" | "recontacto" | "derivado";

interface UIState {
  tab: Tab;
  setTab: (tab: Tab) => void;

  numeroActivo: string | null;
  setNumeroActivo: (numero: string | null) => void;

  filtroLead: FiltroLead;
  setFiltroLead: (filtro: FiltroLead) => void;

  busqueda: string;
  setBusqueda: (q: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  tab: "chats",
  setTab: (tab) => set({ tab }),

  numeroActivo: null,
  setNumeroActivo: (numeroActivo) => set({ numeroActivo }),

  filtroLead: "todos",
  setFiltroLead: (filtroLead) => set({ filtroLead }),

  busqueda: "",
  setBusqueda: (busqueda) => set({ busqueda }),
}));
