"use client";

import { useMemo } from "react";
import { computeFretboard, type FretNote } from "@/core/theory/fretboard";
import { SINGLE_MARKERS, DOUBLE_MARKERS } from "@/core/theory/constants";

// ── SVG 레이아웃 상수 ─────────────────────────────────────
const SVG_WIDTH = 920;

// 반음 → 텐션 표기 (실용음악 표준)
const TENSION_LABELS: Record<number, string> = {
  0:  "1",
  1:  "b9",
  2:  "9",
  3:  "#9",
  4:  "3",
  5:  "11",
  6:  "#11",
  7:  "5",
  8:  "b13",
  9:  "13",
  10: "b7",
  11: "7",
};
const TOP_PAD = 22;
const BOTTOM_PAD = 22;
const LEFT_PAD = 18;     // 개방현 영역
const OPEN_WIDTH = 32;   // 개방현(0프렛) 셀 너비
const RIGHT_PAD = 12;
const STRING_SPACING = 28;
const DOT_RADIUS = 10;

interface FretboardProps {
  rootMidi: number;
  intervals: number[];
  stringMidis: number[];  // 현 배열 (저음→고음)
  fretCount?: number;
  showDegrees?: boolean;  // true: 도수 표시, false: 음이름 표시
  showTension?: boolean;  // true: 텐션 표기로 덮어쓰기
}

export function Fretboard({
  rootMidi,
  intervals,
  stringMidis,
  fretCount = 15,
  showDegrees = true,
  showTension = false,
}: FretboardProps) {
  const rootNoteClass = rootMidi % 12;
  const stringCount = stringMidis.length;
  const svgHeight = TOP_PAD + (stringCount - 1) * STRING_SPACING + BOTTOM_PAD;

  // 프렛 레이아웃 계산
  const fretAreaWidth = SVG_WIDTH - LEFT_PAD - OPEN_WIDTH - RIGHT_PAD;
  const fretSpacing = fretAreaWidth / fretCount;
  const nutX = LEFT_PAD + OPEN_WIDTH;

  // 지판 음 데이터
  const fretboard = useMemo(
    () => computeFretboard(rootMidi, intervals, stringMidis, fretCount),
    [rootMidi, intervals, stringMidis, fretCount]
  );

  // 좌표 헬퍼
  function stringY(stringIdx: number) {
    // 저음 현이 아래, 고음 현이 위
    return TOP_PAD + (stringCount - 1 - stringIdx) * STRING_SPACING;
  }

  function fretCenterX(fret: number) {
    if (fret === 0) return LEFT_PAD + OPEN_WIDTH / 2;
    return nutX + (fret - 0.5) * fretSpacing;
  }

  function fretLineX(fret: number) {
    return nutX + fret * fretSpacing;
  }

  // 포지션 마커가 있는 프렛 필터 (표시 범위 내)
  const singleMarkersInRange = SINGLE_MARKERS.filter((f) => f <= fretCount);
  const doubleMarkersInRange = DOUBLE_MARKERS.filter((f) => f <= fretCount);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
        className="w-full min-w-[600px]"
        style={{ height: svgHeight }}
      >
        {/* ── 배경 ── */}
        <rect width={SVG_WIDTH} height={svgHeight} fill="#0a0a0a" rx={8} />

        {/* ── 포지션 마커 (단점) ── */}
        {singleMarkersInRange.map((fret) => (
          <circle
            key={`marker-${fret}`}
            cx={fretLineX(fret) - fretSpacing / 2}
            cy={svgHeight - 8}
            r={3}
            fill="#2a2a2a"
          />
        ))}

        {/* ── 포지션 마커 (복점, 12프렛) ── */}
        {doubleMarkersInRange.map((fret) => (
          <g key={`dmarker-${fret}`}>
            <circle cx={fretLineX(fret) - fretSpacing / 2} cy={svgHeight - 11} r={3} fill="#2a2a2a" />
            <circle cx={fretLineX(fret) - fretSpacing / 2} cy={svgHeight - 3}  r={3} fill="#2a2a2a" />
          </g>
        ))}

        {/* ── 너트 ── */}
        <rect
          x={nutX - 3}
          y={TOP_PAD - 4}
          width={5}
          height={(stringCount - 1) * STRING_SPACING + 8}
          fill="#555"
          rx={1}
        />

        {/* ── 프렛 라인 ── */}
        {Array.from({ length: fretCount }, (_, i) => i + 1).map((fret) => (
          <line
            key={`fret-${fret}`}
            x1={fretLineX(fret)}
            y1={TOP_PAD - 2}
            x2={fretLineX(fret)}
            y2={TOP_PAD + (stringCount - 1) * STRING_SPACING + 2}
            stroke={fret === 12 ? "#444" : "#262626"}
            strokeWidth={fret === 12 ? 2 : 1}
          />
        ))}

        {/* ── 현 라인 ── */}
        {stringMidis.map((_, si) => {
          const thickness = 1 + (si / (stringCount - 1)) * 1.5;
          return (
            <line
              key={`string-${si}`}
              x1={LEFT_PAD}
              y1={stringY(si)}
              x2={SVG_WIDTH - RIGHT_PAD}
              y2={stringY(si)}
              stroke="#333"
              strokeWidth={thickness}
            />
          );
        })}

        {/* ── 프렛 번호 라벨 (1, 3, 5, 7, 9, 12) ── */}
        {[1, 3, 5, 7, 9, 12].filter((f) => f <= fretCount).map((fret) => (
          <text
            key={`label-${fret}`}
            x={fretLineX(fret) - fretSpacing / 2}
            y={TOP_PAD - 8}
            textAnchor="middle"
            fill="#333"
            fontSize={9}
            fontFamily="monospace"
          >
            {fret}
          </text>
        ))}

        {/* ── 스케일 음 도트 ── */}
        {fretboard.map((stringNotes) =>
          stringNotes.map((note: FretNote) => {
            if (!note.isInScale) return null;

            const cx = fretCenterX(note.fret);
            const cy = stringY(note.string);

            const fillColor = note.isRoot
              ? "#F59E0B"  // 루트: amber
              : "#e5e5e5"; // 나머지: 밝은 회색

            const textColor = note.isRoot ? "#1a1a1a" : "#1a1a1a";

            // 텐션 표기가 켜져 있으면 루트까지의 반음 간격으로 라벨 결정
            let label: string;
            if (showTension) {
              const semitones = (note.noteClass - rootNoteClass + 12) % 12;
              label = TENSION_LABELS[semitones];
            } else {
              label = showDegrees ? String(note.degree ?? "") : note.noteName;
            }

            // 글자 수에 따라 폰트 크기 자동 조정 (b13, #11 등 3글자 대응)
            const fontSize = label.length <= 1 ? 8.5
              : label.length === 2 ? 7
              : 5.5;

            return (
              <g key={`note-${note.string}-${note.fret}`}>
                {/* 루트음 글로우 */}
                {note.isRoot && (
                  <circle cx={cx} cy={cy} r={DOT_RADIUS + 3} fill="#F59E0B22" />
                )}
                <circle cx={cx} cy={cy} r={DOT_RADIUS} fill={fillColor} />
                <text
                  x={cx}
                  y={cy + (label.length >= 3 ? 2.5 : 3.5)}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={fontSize}
                  fontWeight={note.isRoot ? "bold" : "normal"}
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
