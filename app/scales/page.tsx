"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useFeatureNavigation } from "@/hooks/useFeatureNavigation";
import { Fretboard } from "@/components/Fretboard";
import { RootSelector } from "@/components/RootSelector";
import { ScaleSelector } from "@/components/ScaleSelector";
import { NOTE_NAMES, INSTRUMENTS, type InstrumentConfig } from "@/core/theory/constants";
import { SCALES } from "@/core/theory/scales";
import { useScaleStore } from "@/store/useScaleStore";

const DEFAULT_INSTRUMENT = INSTRUMENTS[0]; // 기타 6현

// 7현 기타 기준 고정 높이: TOP_PAD(22) + (7-1) × STRING_SPACING(28) + BOTTOM_PAD(22) = 212px
const FRETBOARD_FIXED_HEIGHT = 212;

// 반음 → 텐션 표기 (Fretboard.tsx와 동일한 매핑)
const TENSION_LABELS: Record<number, string> = {
  0: "1", 1: "b9", 2: "9",  3: "#9",
  4: "3", 5: "11", 6: "#11", 7: "5",
  8: "b13", 9: "13", 10: "b7", 11: "7",
};

// 반응형 프렛 수: 컨테이너 700px → 15프렛, 이후 80px당 +1, 최대 24프렛
function calcFretCount(containerWidth: number): number {
  const computed = Math.round(15 + (containerWidth - 700) / 80);
  return Math.max(15, Math.min(24, computed));
}

export default function ScalesPage() {
  // 루트·스케일은 전역 store (퀴즈 페이지와 공유)
  const { rootIndex, scaleId, setRootIndex, setScaleId } = useScaleStore();
  const scale = SCALES.find((s) => s.id === scaleId) ?? SCALES[0];

  const [instrument, setInstrument] = useState<InstrumentConfig>(DEFAULT_INSTRUMENT);
  const [showDegrees, setShowDegrees] = useState(true);
  const [showTension, setShowTension] = useState(false);
  const [fretCount, setFretCount] = useState(15);

  const fretboardRef = useRef<HTMLDivElement>(null);

  useFeatureNavigation("/scales");

  // 컨테이너 너비 감지 → 프렛 수 동적 조정
  useEffect(() => {
    const el = fretboardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setFretCount(calcFretCount(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 루트음 MIDI: C4(60) 기준으로 옥타브 고정 (시각화용, 음정 클래스만 중요)
  const rootMidi = 60 + rootIndex;

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">

      {/* 헤더 */}
      <header className="flex items-center px-6 pt-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 3L5.5 8l5 5" />
          </svg>
          홈
        </Link>
      </header>

      {/* ── 타이틀 행 (폭 제한) ── */}
      <div className="px-6 pt-8 pb-4 max-w-5xl w-full mx-auto flex items-center justify-between">
        <h1 className="text-xs tracking-[0.3em] text-neutral-600 uppercase font-medium">
          Scale Guide
        </h1>
        <span className="text-sm text-neutral-400">
          {NOTE_NAMES[rootIndex]} {scale.name}
        </span>
      </div>

      {/* ── 지판 (24프렛 기준 최대 너비 고정) ── */}
      <div className="px-6">
        <div
          ref={fretboardRef}
          className="rounded-xl overflow-hidden border border-neutral-800/60 bg-[#0a0a0a] flex items-center w-full max-w-[1420px] mx-auto"
          style={{ minHeight: FRETBOARD_FIXED_HEIGHT }}
        >
          <Fretboard
            rootMidi={rootMidi}
            intervals={scale.intervals}
            stringMidis={instrument.strings}
            fretCount={fretCount}
            showDegrees={showDegrees}
            showTension={showTension}
          />
        </div>
      </div>

      {/* ── 컨트롤 영역 (폭 제한) ── */}
      <div className="px-6 py-8 max-w-5xl w-full mx-auto flex flex-col gap-6">

        {/* 악기 선택 + 표시 모드 토글 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setInstrument(inst)}
                className={`
                  px-3 h-8 rounded-lg text-xs transition-all duration-150
                  ${instrument.id === inst.id
                    ? "bg-neutral-700 text-neutral-200"
                    : "bg-neutral-900 text-neutral-600 hover:text-neutral-400 border border-neutral-800"
                  }
                `}
              >
                {inst.label}
              </button>
            ))}
          </div>

          {/* 도수 / 음이름 토글 */}
          <button
            onClick={() => setShowDegrees((v) => !v)}
            className="px-3 h-8 rounded-lg text-xs bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800 transition-colors"
          >
            {showDegrees ? "도수 표시 중" : "음이름 표시 중"}
          </button>

          {/* 텐션 표기 토글 */}
          <button
            onClick={() => setShowTension((v) => !v)}
            className={`
              px-3 h-8 rounded-lg text-xs transition-all duration-150
              ${showTension
                ? "bg-amber-400/15 text-amber-400 border border-amber-400/40"
                : "bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800"
              }
            `}
          >
            텐션 표기
          </button>
        </div>

        {/* 루트 선택 */}
        <RootSelector rootIndex={rootIndex} onChange={setRootIndex} />

        {/* 스케일 선택 */}
        <ScaleSelector selectedId={scaleId} onChange={(s) => setScaleId(s.id)} />

        {/* 스케일 인터벌 정보 */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] tracking-widest text-neutral-700 uppercase font-medium">
            Intervals
          </span>
          <div className="flex gap-2 flex-wrap">
            {scale.intervals.map((interval, i) => {
              const tensionLabel = TENSION_LABELS[interval];
              const isRoot = i === 0;

              // 글자 수에 따라 폰트 크기 조정 (텐션 모드에서 b13, #11 등 3글자 대응)
              const labelFontSize = showTension && tensionLabel.length >= 3
                ? "text-[9px]"
                : showTension && tensionLabel.length === 2
                  ? "text-[10px]"
                  : "text-xs";

              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold
                      transition-all duration-200
                      ${labelFontSize}
                      ${isRoot
                        ? "bg-amber-400 text-neutral-900"
                        : showTension
                          ? "bg-amber-400/10 text-amber-400 border border-amber-400/40"
                          : "bg-neutral-800 text-neutral-400"
                      }
                    `}
                    style={
                      showTension && !isRoot
                        ? { boxShadow: "0 0 8px rgba(251,191,36,0.35), 0 0 2px rgba(251,191,36,0.6)" }
                        : undefined
                    }
                  >
                    {showTension ? tensionLabel : i + 1}
                  </span>
                  <span className="text-[9px] text-neutral-700 font-mono">
                    +{interval}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
