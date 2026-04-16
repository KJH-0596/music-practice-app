import { create } from "zustand";
import { BPM_DEFAULT, TIME_SIGNATURES } from "@/types/audio";
import type { TimeSignature } from "@/types/audio";

interface MetronomeState {
  bpm: number;
  timeSignature: TimeSignature;
  isPlaying: boolean;
  currentBeat: number; // 현재 강조 중인 박자 인덱스 (0-based)

  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentBeat: (beat: number) => void;
}

export const useMetronomeStore = create<MetronomeState>((set) => ({
  bpm: BPM_DEFAULT,
  timeSignature: TIME_SIGNATURES[2], // 기본값: 4/4
  isPlaying: false,
  currentBeat: -1,

  setBpm: (bpm) =>
    set({ bpm: Math.max(40, Math.min(240, bpm)) }),

  setTimeSignature: (timeSignature) =>
    set({ timeSignature, currentBeat: -1 }),

  setIsPlaying: (isPlaying) =>
    set({ isPlaying, currentBeat: isPlaying ? 0 : -1 }),

  setCurrentBeat: (currentBeat) => set({ currentBeat }),
}));
