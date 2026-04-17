/**
 * 지판 음 위치 계산
 * 현 수에 무관하게 동작 (6현 기타, 4현 베이스, 7현 등 모두 지원)
 */

import { NOTE_NAMES } from "./constants";
import { getScaleInfo } from "./scales";

export type FretNote = {
  string: number;  // 0 = 최저음 현
  fret: number;    // 0 = 개방현
  midi: number;
  noteClass: number; // 0~11
  noteName: string;
  isRoot: boolean;
  isInScale: boolean;
  degree: number | null; // 1-based (1=루트, 2=2도, …)
};

/**
 * 지판 전체의 음 정보 계산
 * @param rootMidi  루트음 MIDI 번호
 * @param intervals 스케일 인터벌 배열
 * @param stringMidis 각 현의 개방음 MIDI (저음→고음)
 * @param fretCount 표시할 프렛 수
 * @returns FretNote[string][fret] 형태의 2D 배열
 */
export function computeFretboard(
  rootMidi: number,
  intervals: number[],
  stringMidis: number[],
  fretCount: number = 15
): FretNote[][] {
  const { noteClasses, degreeMap } = getScaleInfo(rootMidi, intervals);
  const rootClass = rootMidi % 12;

  return stringMidis.map((openMidi, stringIndex) =>
    Array.from({ length: fretCount + 1 }, (_, fret) => {
      const midi = openMidi + fret;
      const noteClass = midi % 12;
      return {
        string: stringIndex,
        fret,
        midi,
        noteClass,
        noteName: NOTE_NAMES[noteClass],
        isRoot: noteClass === rootClass,
        isInScale: noteClasses.has(noteClass),
        degree: degreeMap.get(noteClass) ?? null,
      };
    })
  );
}
