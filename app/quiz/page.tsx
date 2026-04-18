"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useFeatureNavigation } from "@/hooks/useFeatureNavigation";
import { Fretboard, type QuizMark } from "@/components/Fretboard";
import { EdgeFlash } from "@/components/EdgeFlash";
import { useScaleStore } from "@/store/useScaleStore";
import { SCALES } from "@/core/theory/scales";
import { NOTE_NAMES, INSTRUMENTS, type InstrumentConfig } from "@/core/theory/constants";
import { getScaleInfo } from "@/core/theory/scales";

// 지판 고정 높이 (7현 기타 기준, scales 페이지와 동일)
const FRETBOARD_FIXED_HEIGHT = 212;

function calcFretCount(containerWidth: number): number {
  const computed = Math.round(15 + (containerWidth - 700) / 80);
  return Math.max(15, Math.min(24, computed));
}

type Mode = "click" | "guitar";

export default function QuizPage() {
  useFeatureNavigation("/quiz");

  // ── 공유 스케일 state ──
  const { rootIndex, scaleId, setRootIndex, setScaleId } = useScaleStore();
  const scale = SCALES.find((s) => s.id === scaleId) ?? SCALES[0];
  const rootMidi = 60 + rootIndex;
  const { noteClasses } = getScaleInfo(rootMidi, scale.intervals);

  // ── 로컬 UI state ──
  const [instrument, setInstrument] = useState<InstrumentConfig>(INSTRUMENTS[0]);
  const [mode, setMode] = useState<Mode>("click");
  const [fretCount, setFretCount] = useState(15);

  // ── 퀴즈 마킹 state ──
  const [correctMarks, setCorrectMarks] = useState<QuizMark[]>([]);
  const [wrongMarks,   setWrongMarks]   = useState<QuizMark[]>([]);
  const [flashKey,  setFlashKey]  = useState<number | null>(null);
  const [flashType, setFlashType] = useState<"correct" | "wrong">("correct");
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  // ── 반응형 프렛 수 ──
  const fretboardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = fretboardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setFretCount(calcFretCount(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── 마킹 초기화 (스케일/루트/악기 변경 시) ──
  useEffect(() => {
    setCorrectMarks([]);
    setWrongMarks([]);
    setScore({ correct: 0, wrong: 0 });
  }, [rootIndex, scaleId, instrument.id]);

  // ── 프렛 클릭 판정 ──
  const handleFretClick = useCallback(
    (stringIdx: number, fret: number, noteClass: number) => {
      const id = `${stringIdx}-${fret}-${Date.now()}`;
      const isCorrect = noteClasses.has(noteClass);

      setFlashType(isCorrect ? "correct" : "wrong");
      setFlashKey(Date.now());

      if (isCorrect) {
        setCorrectMarks((prev) => [...prev, { string: stringIdx, fret, id }].slice(-10));
        setScore((s) => ({ ...s, correct: s.correct + 1 }));
      } else {
        setWrongMarks((prev) => [...prev, { string: stringIdx, fret, id }]);
        setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
        // 1.2초 후 dying 상태 → opacity 0 트랜지션 시작
        setTimeout(() => {
          setWrongMarks((prev) => prev.map((m) => m.id === id ? { ...m, dying: true } : m));
        }, 1200);
        // 1.7초 후 DOM에서 제거 (0.5초 fade 완료 후)
        setTimeout(() => {
          setWrongMarks((prev) => prev.filter((m) => m.id !== id));
        }, 1700);
      }
    },
    [noteClasses]
  );

  const handleReset = () => {
    setCorrectMarks([]);
    setWrongMarks([]);
    setScore({ correct: 0, wrong: 0 });
  };

  // 랜덤 스케일 + 루트 선택
  const handleRandom = useCallback(() => {
    const newRoot = Math.floor(Math.random() * 12);
    const newScale = SCALES[Math.floor(Math.random() * SCALES.length)];
    setRootIndex(newRoot);
    setScaleId(newScale.id);
  }, [setRootIndex, setScaleId]);

  const hasScale = !!scale;

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">

      {/* EdgeFlash 오버레이: key가 바뀔 때마다 리마운트 → 애니메이션 재생 */}
      {flashKey !== null && (
        <EdgeFlash key={flashKey} type={flashType} />
      )}

      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 pt-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 3L5.5 8l5 5" />
          </svg>
          홈
        </Link>

        {/* 스코어 */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-green-400">✓ {score.correct}</span>
          <span className="text-neutral-700">|</span>
          <span className="text-red-400">✕ {score.wrong}</span>
          <button
            onClick={handleReset}
            className="ml-2 px-2 h-6 rounded text-neutral-600 hover:text-neutral-400 border border-neutral-800 text-[10px] transition-colors"
          >
            초기화
          </button>
        </div>
      </header>

      {/* 타이틀 + 랜덤 버튼 + 현재 스케일 */}
      <div className="px-6 pt-6 pb-4 max-w-5xl w-full mx-auto flex items-center justify-between">
        <h1 className="text-xs tracking-[0.3em] text-neutral-600 uppercase font-medium">
          Scale Quiz
        </h1>
        <div className="flex items-center gap-2">
          {/* 랜덤 버튼 */}
          <button
            onClick={handleRandom}
            title="랜덤 스케일"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-600 hover:text-amber-400 hover:bg-neutral-800 transition-all duration-150"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5h8.5a2 2 0 0 1 2 2v1" />
              <path d="M10 3l2.5 2L10 7" />
              <path d="M13 10H4.5a2 2 0 0 1-2-2V7" />
              <path d="M5 12l-2.5-2L5 8" />
            </svg>
          </button>
          {/* 스케일 이름 (클릭 시 Scale Guide로 이동) */}
          <Link
            href="/scales"
            className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            {NOTE_NAMES[rootIndex]} {scale.name}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4.5 2.5L8 6l-3.5 3.5" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 스케일 미선택 안내 */}
      {!hasScale && (
        <div className="px-6 max-w-5xl w-full mx-auto">
          <Link href="/scales" className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm hover:bg-amber-400/20 transition-colors">
            Scale Guide에서 스케일을 먼저 선택해주세요 →
          </Link>
        </div>
      )}

      {/* 모드 탭 + 악기 선택 */}
      <div className="px-6 pb-4 max-w-5xl w-full mx-auto flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
          <button
            onClick={() => setMode("click")}
            className={`px-3 h-7 rounded-md text-xs transition-all duration-150 ${
              mode === "click"
                ? "bg-neutral-700 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            지판 클릭
          </button>
          <button
            disabled
            className="px-3 h-7 rounded-md text-xs text-neutral-700 cursor-not-allowed"
            title="준비 중"
          >
            기타 연주
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {INSTRUMENTS.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setInstrument(inst)}
              className={`px-3 h-8 rounded-lg text-xs transition-all duration-150 ${
                instrument.id === inst.id
                  ? "bg-neutral-700 text-neutral-200"
                  : "bg-neutral-900 text-neutral-600 hover:text-neutral-400 border border-neutral-800"
              }`}
            >
              {inst.label}
            </button>
          ))}
        </div>
      </div>

      {/* 지판 */}
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
            quizMode={mode === "click"}
            onFretClick={mode === "click" ? handleFretClick : undefined}
            correctMarks={correctMarks}
            wrongMarks={wrongMarks}
          />
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="px-6 pt-6 max-w-5xl w-full mx-auto">
        <p className="text-xs text-neutral-700 text-center">
          {mode === "click"
            ? `${NOTE_NAMES[rootIndex]} ${scale.name} 스케일에 속하는 음을 지판에서 클릭하세요`
            : "기타 연주 모드는 준비 중입니다"}
        </p>
      </div>
    </main>
  );
}
