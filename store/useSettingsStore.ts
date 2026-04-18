import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  audioDeviceId: string | null;
  inputGain: number; // 입력 게인 배율 (1 = 원본, 4 = 4배 증폭)
  setAudioDeviceId: (id: string | null) => void;
  setInputGain: (gain: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioDeviceId: null,
      inputGain: 4,
      setAudioDeviceId: (audioDeviceId) => set({ audioDeviceId }),
      setInputGain: (inputGain) => set({ inputGain }),
    }),
    { name: "music-app-settings" }
  )
);
