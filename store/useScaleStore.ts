import { create } from "zustand";

interface ScaleState {
  rootIndex: number; // 0~11 (C=0 … B=11)
  scaleId: string;
  setRootIndex: (idx: number) => void;
  setScaleId: (id: string) => void;
}

export const useScaleStore = create<ScaleState>((set) => ({
  rootIndex: 4,               // 기본값: E
  scaleId: "minor_pentatonic", // 기본값: 마이너 펜타토닉
  setRootIndex: (rootIndex) => set({ rootIndex }),
  setScaleId:   (scaleId)   => set({ scaleId }),
}));
