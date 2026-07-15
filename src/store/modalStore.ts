import type { ReactNode } from "react";
import { create } from "zustand";

interface ModalOpts {
  title?: string;
  widthClass?: string;
}

interface ModalState {
  abierto: boolean;
  content: ReactNode | null;
  title?: string;
  widthClass: string;
  showModal: (content: ReactNode, opts?: ModalOpts) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  abierto: false,
  content: null,
  title: undefined,
  widthClass: "max-w-md",
  showModal: (content, opts) =>
    set({
      abierto: true,
      content,
      title: opts?.title,
      widthClass: opts?.widthClass ?? "max-w-md",
    }),
  closeModal: () => set({ abierto: false }),
}));
