"use client";

import { useState } from "react";
import Link from "next/link";
import { useFeatureNavigation } from "@/hooks/useFeatureNavigation";
import { Fretboard } from "@/components/Fretboard";
import { RootSelector } from "@/components/RootSelector";
import { ScaleSelector } from "@/components/ScaleSelector";
import { NOTE_NAMES, INSTRUMENTS, type InstrumentConfig } from "@/core/theory/constants";
import { SCALES, type ScaleConfig } from "@/core/theory/scales";

const DEFAULT_ROOT = 4;  // E
const DEFAULT_SCALE = SCALES.find((s) => s.id === "minor_pentatonic")!;
const DEFAULT_INSTRUMENT = INSTRUMENTS[0]; // Guitar 6현

export default function ScalesPage() {
  const [rootIndex, setRootIndex] = useState(DEFAULT_ROOT);
  const [scale, setScale] = useState<ScaleConfig>(DEFAULT_SCALE);
  const [instrument, setInstrument] = useState<InstrumentConfig>(DEFAULT_INSTRUMENT);
  const [showDegrees, setShowDegrees] = useState(true);

  useFeatureNavigation("/scales");

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

      <div className="flex-1 flex flex-col gap-8 px-6 py-8 max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xs tracking-[0.3em] text-neutral-600 uppercase font-medium">
            Scale Guide
          </h1>

          {/* 현재 선택 요약 */}
          <span className="text-sm text-neutral-400">
            {NOTE_NAMES[rootIndex]} {scale.name}
          </span>
        </div>

        {/* ── 지판 ── */}
        <div className="rounded-xl overflow-hidden border border-neutral-800/60">
          <Fretboard
            rootMidi={rootMidi}
            intervals={scale.intervals}
            stringMidis={instrument.strings}
            fretCount={instrument.fretCount}
            showDegrees={showDegrees}
          />
        </div>

        {/* ── 컨트롤 영역 ── */}
        <div className="flex flex-col gap-6">

          {/* 악기 선택 + 표시 모드 토글 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-1.5">
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
          </div>

          {/* 루트 선택 */}
          <RootSelector rootIndex={rootIndex} onChange={setRootIndex} />

          {/* 스케일 선택 */}
          <ScaleSelector selectedId={scale.id} onChange={setScale} />

          {/* 스케일 인터벌 정보 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] tracking-widest text-neutral-700 uppercase font-medium">
              Intervals
            </span>
            <div className="flex gap-2 flex-wrap">
              {scale.intervals.map((interval, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono
                    ${i === 0
                      ? "bg-amber-400 text-neutral-900 font-bold"
                      : "bg-neutral-800 text-neutral-400"
                    }
                  `}>
                    {i + 1}
                  </span>
                  <span className="text-[9px] text-neutral-700 font-mono">
                    +{interval}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
