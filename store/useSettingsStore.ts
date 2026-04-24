import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  audioDeviceId: string | null;
  inputChannel: number;    // 오디오 입력 채널 인덱스 (0 = CH1, 1 = CH2)
  inputGain: number;       // 튜너 입력 게인 배율 (1 = 원본, 4 = 4배 증폭)
  metronomeVolume: number; // 메트로놈 볼륨 dB (-10~+10, 기본 0)
  setAudioDeviceId: (id: string | null) => void;
  setInputChannel: (ch: number) => void;
  setInputGain: (gain: number) => void;
  setMetronomeVolume: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioDeviceId: null,
      inputChannel: 0,
      inputGain: 4,
      metronomeVolume: 0,
      setAudioDeviceId: (audioDeviceId) => set({ audioDeviceId }),
      setInputChannel: (inputChannel) => set({ inputChannel }),
      setInputGain: (inputGain) => set({ inputGain }),
      setMetronomeVolume: (metronomeVolume) => set({ metronomeVolume }),
    }),
    { name: "music-app-settings-v2" }
  )
);
