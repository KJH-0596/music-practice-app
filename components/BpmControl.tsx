"use client";

import { useRef, useCallback } from "react";

interface BpmControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

export function BpmControl({ bpm, onChange }: BpmControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      // Shift 키: 10 단위, 기본: 1 단위
      const step = e.shiftKey ? 10 : 1;
      const delta = e.deltaY < 0 ? step : -step;
      onChange(bpm + delta);
    },
    [bpm, onChange]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
        BPM
      </span>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="relative group cursor-ns-resize select-none"
        title="스크롤로 BPM 조절 | Shift+스크롤: 10단위"
      >
        {/* BPM 숫자 */}
        <span className="text-[88px] font-thin tabular-nums leading-none text-white transition-colors group-hover:text-amber-400">
          {bpm}
        </span>

        {/* 호버 시 힌트 */}
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          ↕ scroll to adjust
        </span>
      </div>

      {/* BPM 템포 이름 */}
      <span className="text-sm text-neutral-500 mt-2">
        {getTempoLabel(bpm)}
      </span>
    </div>
  );
}

function getTempoLabel(bpm: number): string {
  if (bpm < 60) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
}
