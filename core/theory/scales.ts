/**
 * 스케일/모드 데이터 및 음 계산
 */

export type ScaleCategory = "standard" | "jazz" | "dark" | "rock_blues";

export type ScaleConfig = {
  id: string;
  name: string;
  koreanName: string;
  intervals: number[]; // 루트로부터의 반음 수
  category: ScaleCategory;
};

export const SCALES: ScaleConfig[] = [
  // ── Standard ────────────────────────────────
  {
    id: "major",
    name: "Major (Ionian)",
    koreanName: "메이저",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    category: "standard",
  },
  {
    id: "natural_minor",
    name: "Natural Minor (Aeolian)",
    koreanName: "내추럴 마이너",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    category: "standard",
  },
  // ── Jazz & Fusion ────────────────────────────
  {
    id: "dorian",
    name: "Dorian",
    koreanName: "도리안",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    category: "jazz",
  },
  {
    id: "lydian",
    name: "Lydian",
    koreanName: "리디안",
    intervals: [0, 2, 4, 6, 7, 9, 11],
    category: "jazz",
  },
  {
    id: "melodic_minor",
    name: "Melodic Minor",
    koreanName: "멜로딕 마이너",
    intervals: [0, 2, 3, 5, 7, 9, 11],
    category: "jazz",
  },
  {
    id: "whole_tone",
    name: "Whole Tone",
    koreanName: "홀톤",
    intervals: [0, 2, 4, 6, 8, 10],
    category: "jazz",
  },
  {
    id: "diminished_hw",
    name: "Diminished (HW)",
    koreanName: "디미니쉬드 HW",
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    category: "jazz",
  },
  {
    id: "diminished_wh",
    name: "Diminished (WH)",
    koreanName: "디미니쉬드 WH",
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    category: "jazz",
  },
  // ── Dark & Exotic ────────────────────────────
  {
    id: "phrygian",
    name: "Phrygian",
    koreanName: "프리지안",
    intervals: [0, 1, 3, 5, 7, 8, 10],
    category: "dark",
  },
  {
    id: "locrian",
    name: "Locrian",
    koreanName: "로크리안",
    intervals: [0, 1, 3, 5, 6, 8, 10],
    category: "dark",
  },
  {
    id: "harmonic_minor",
    name: "Harmonic Minor",
    koreanName: "하모닉 마이너",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    category: "dark",
  },
  // ── Rock & Blues ─────────────────────────────
  {
    id: "major_pentatonic",
    name: "Major Pentatonic",
    koreanName: "메이저 펜타토닉",
    intervals: [0, 2, 4, 7, 9],
    category: "rock_blues",
  },
  {
    id: "minor_pentatonic",
    name: "Minor Pentatonic",
    koreanName: "마이너 펜타토닉",
    intervals: [0, 3, 5, 7, 10],
    category: "rock_blues",
  },
  {
    id: "major_blues",
    name: "Major Blues",
    koreanName: "메이저 블루스",
    intervals: [0, 2, 3, 4, 7, 9],
    category: "rock_blues",
  },
  {
    id: "minor_blues",
    name: "Minor Blues",
    koreanName: "마이너 블루스",
    intervals: [0, 3, 5, 6, 7, 10],
    category: "rock_blues",
  },
  {
    id: "mixolydian",
    name: "Mixolydian",
    koreanName: "믹솔리디안",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    category: "rock_blues",
  },
];

/** 카테고리 레이블 */
export const SCALE_CATEGORY_LABEL: Record<ScaleCategory, string> = {
  standard:  "Standard",
  jazz:      "Jazz & Fusion",
  dark:      "Dark & Exotic",
  rock_blues: "Rock & Blues",
};

/**
 * 루트 MIDI + 스케일 인터벌 → 스케일 음정 클래스(0~11) Set 반환
 * interval degree map도 함께 반환 (음정 클래스 → 도수, 1-based)
 */
export function getScaleInfo(rootMidi: number, intervals: number[]) {
  const noteClasses = new Set<number>();
  const degreeMap = new Map<number, number>(); // noteClass → degree

  intervals.forEach((interval, i) => {
    const nc = (rootMidi + interval) % 12;
    noteClasses.add(nc);
    degreeMap.set(nc, i + 1);
  });

  return { noteClasses, degreeMap };
}

/** 도수(1~7) → 로마 숫자 표기 */
export const DEGREE_LABELS = ["1", "2", "3", "4", "5", "6", "7", "b2", "b3", "b5", "b6", "b7"];
export function getDegreeLabel(degree: number): string {
  return String(degree);
}
