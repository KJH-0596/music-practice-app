/**
 * 음악 이론 공통 상수
 * 튜닝은 MIDI 번호 기준 (저음 → 고음 순서)
 * 현 수 기반 설계 → 7현 기타, 5/6현 베이스 등 확장 가능
 */

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type NoteName = (typeof NOTE_NAMES)[number];

// ── 악기 튜닝 정의 ──────────────────────────────────────────────────
export type InstrumentConfig = {
  id: string;
  label: string;
  strings: number[]; // 각 현의 개방음 MIDI 번호 (저음→고음)
  fretCount: number;
};

export const INSTRUMENTS: InstrumentConfig[] = [
  {
    id: "guitar_6",
    label: "기타 6현",
    strings: [40, 45, 50, 55, 59, 64], // E2 A2 D3 G3 B3 E4
    fretCount: 15,
  },
  {
    id: "guitar_7",
    label: "기타 7현",
    strings: [35, 40, 45, 50, 55, 59, 64], // B1 E2 A2 D3 G3 B3 E4
    fretCount: 15,
  },
  {
    id: "bass_4",
    label: "베이스 4현",
    strings: [28, 33, 38, 43], // E1 A1 D2 G2
    fretCount: 15,
  },
  {
    id: "bass_5",
    label: "베이스 5현",
    strings: [23, 28, 33, 38, 43], // B0 E1 A1 D2 G2
    fretCount: 15,
  },
  {
    id: "bass_6",
    label: "베이스 6현",
    strings: [23, 28, 33, 38, 43, 47], // B0 E1 A1 D2 G2 C3
    fretCount: 15,
  },
];

// 지판 포지션 마커 (홀수 프렛 점, 12프렛 복점)
export const SINGLE_MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
export const DOUBLE_MARKERS = [12, 24];
