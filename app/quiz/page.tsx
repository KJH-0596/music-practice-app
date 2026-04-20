"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useFeatureNavigation } from "@/hooks/useFeatureNavigation";
import { Fretboard, type QuizMark } from "@/components/Fretboard";
import { EdgeFlash } from "@/components/EdgeFlash";
import { StrobeTuner } from "@/components/StrobeTuner";
import { useTuner } from "@/hooks/useTuner";
import { useScaleStore } from "@/store/useScaleStore";
import { useMetronomeStore } from "@/store/useStore";
import { startAudioEngine } from "@/core/audio/engine";
import { startMetronome, stopMetronome, updateBpm } from "@/core/audio/metronome";
import { SubdivisionSelector } from "@/components/SubdivisionSelector";
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

  // ── 메트로놈 store ──
  const { bpm, timeSignature, subdivision, currentBeat, setBpm, setCurrentBeat, setIsPlaying, setSubdivision } = useMetronomeStore();

  // ── 로컬 UI state ──
  const [instrument, setInstrument] = useState<InstrumentConfig>(INSTRUMENTS[0]);
  const [mode, setMode] = useState<Mode>("click");
  const [fretCount, setFretCount] = useState(15);
  const [metronomeOn, setMetronomeOn] = useState(false);

  // 모드 전환 effect에서 stale closure 방지용 ref
  const metronomeOnRef = useRef(false);
  useEffect(() => {
    metronomeOnRef.current = metronomeOn;
  }, [metronomeOn]);

  // ── 퀴즈 마킹 state ──
  const [correctMarks, setCorrectMarks] = useState<QuizMark[]>([]);
  const [wrongMarks,   setWrongMarks]   = useState<QuizMark[]>([]);
  const [flashKey,  setFlashKey]  = useState<number | null>(null);
  const [flashType, setFlashType] = useState<"correct" | "wrong">("correct");
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  // ── 스케일 커버리지 (기타 연주 모드) ──
  const [coverage, setCoverage] = useState<Set<number>>(new Set());

  // ── 튜너 훅 ──
  const { state: tunerState, pitch, errorMessage, start, stop } = useTuner();

  // ── 직전 트리거 음정 클래스 (중복 방지) ──
  const lastNoteClassRef = useRef<number>(-1);

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

  // ── 마킹·커버리지 초기화 (스케일/루트/악기 변경 시) ──
  useEffect(() => {
    setCorrectMarks([]);
    setWrongMarks([]);
    setScore({ correct: 0, wrong: 0 });
    setCoverage(new Set());
    lastNoteClassRef.current = -1;
  }, [rootIndex, scaleId, instrument.id]);

  // ── 모드 전환: 마이크 + 메트로놈 자동 시작/정지 ──
  useEffect(() => {
    if (mode === "guitar") {
      start();
    } else {
      stop();
      lastNoteClassRef.current = -1;
      // 기타 모드를 벗어나면 메트로놈도 정지
      if (metronomeOnRef.current) {
        stopMetronome();
        setMetronomeOn(false);
        setIsPlaying(false);
        setCurrentBeat(-1);
      }
    }
  }, [mode, start, stop, setIsPlaying, setCurrentBeat]);

  // ── 언마운트 시 메트로놈 정리 ──
  useEffect(() => {
    return () => {
      stopMetronome();
    };
  }, []);

  // ── 메트로놈 토글 ──
  const toggleMetronome = useCallback(async () => {
    if (metronomeOn) {
      stopMetronome();
      setMetronomeOn(false);
      setIsPlaying(false);
      setCurrentBeat(-1);
    } else {
      await startAudioEngine();
      setMetronomeOn(true);
      setIsPlaying(true);
      await startMetronome(bpm, timeSignature, subdivision, (beatIdx) => {
        setCurrentBeat(beatIdx);
      });
    }
  }, [metronomeOn, bpm, timeSignature, setIsPlaying, setCurrentBeat]);

  // ── BPM 변경 ──
  const handleBpmChange = useCallback((newBpm: number) => {
    const clamped = Math.max(40, Math.min(240, newBpm));
    setBpm(clamped);
    updateBpm(clamped);
  }, [setBpm]);

  // ── 기타 연주 모드: 피치 감지 → 스케일 판정 ──
  useEffect(() => {
    if (mode !== "guitar") return;

    if (!pitch) {
      lastNoteClassRef.current = -1;
      return;
    }

    const midiRound = Math.round(12 * Math.log2(pitch.frequency / 440) + 69);
    const noteClass = ((midiRound % 12) + 12) % 12;

    if (noteClass === lastNoteClassRef.current) return;
    lastNoteClassRef.current = noteClass;

    const isCorrect = noteClasses.has(noteClass);
    setFlashType(isCorrect ? "correct" : "wrong");
    setFlashKey(Date.now());

    if (isCorrect) {
      setCoverage((prev) => new Set([...prev, noteClass]));
      setScore((s) => ({ ...s, correct: s.correct + 1 }));
    } else {
      setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
    }
  }, [pitch, mode, noteClasses]);

  // ── 프렛 클릭 판정 (클릭 모드) ──
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
        setTimeout(() => {
          setWrongMarks((prev) => prev.map((m) => m.id === id ? { ...m, dying: true } : m));
        }, 1200);
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
    setCoverage(new Set());
    lastNoteClassRef.current = -1;
  };

  const handleRandom = useCallback(() => {
    const newRoot = Math.floor(Math.random() * 12);
    const newScale = SCALES[Math.floor(Math.random() * SCALES.length)];
    setRootIndex(newRoot);
    setScaleId(newScale.id);
  }, [setRootIndex, setScaleId]);

  const hasScale = !!scale;

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">

      {/* EdgeFlash 오버레이 */}
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
        <div className="flex items-center gap-3 text-xs font-mono pr-10">
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
          Training
        </h1>
        <div className="flex items-center gap-2">
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
            onClick={() => setMode("guitar")}
            className={`px-3 h-7 rounded-md text-xs transition-all duration-150 ${
              mode === "guitar"
                ? "bg-neutral-700 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            기타 연주
          </button>
        </div>

        {mode === "click" && (
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
        )}
      </div>

      {/* ── 클릭 모드: 지판 ── */}
      {mode === "click" && (
        <div className="px-6">
          <div
            ref={fretboardRef}
            className="rounded-xl overflow-hidden border border-neutral-800/60 bg-[#0a0a0a] flex items-center w-full max-w-355 mx-auto"
            style={{ minHeight: FRETBOARD_FIXED_HEIGHT }}
          >
            <Fretboard
              rootMidi={rootMidi}
              intervals={scale.intervals}
              stringMidis={instrument.strings}
              fretCount={fretCount}
              quizMode={true}
              onFretClick={handleFretClick}
              correctMarks={correctMarks}
              wrongMarks={wrongMarks}
            />
          </div>
        </div>
      )}

      {/* ── 기타 연주 모드: 튜너 + 메트로놈 + 커버리지 ── */}
      {mode === "guitar" && (
        <div className="px-6 flex flex-col items-center gap-8 py-4">

          {tunerState === "error" && errorMessage && (
            <p className="text-red-400/80 text-sm text-center max-w-sm">{errorMessage}</p>
          )}
          {tunerState === "idle" && !errorMessage && (
            <p className="text-neutral-700 text-xs tracking-widest animate-pulse">마이크 준비 중…</p>
          )}

          {/* StrobeTuner */}
          <StrobeTuner pitch={pitch} isListening={tunerState === "listening"} />

          {pitch && (
            <p className="text-[11px] text-neutral-700 font-mono -mt-4">
              {pitch.note}{pitch.octave} · {pitch.frequency} Hz
            </p>
          )}

          {/* ── 메트로놈 섹션 ── */}
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">

            {/* 비트 인디케이터 */}
            <div className="flex items-center gap-2 h-6">
              {Array.from({ length: timeSignature.beats }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-75 ${
                    metronomeOn && currentBeat === i
                      ? i === 0
                        ? "w-4 h-4 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                        : "w-3 h-3 bg-amber-400/60"
                      : i === 0
                        ? "w-4 h-4 bg-neutral-800"
                        : "w-3 h-3 bg-neutral-800"
                  }`}
                />
              ))}
            </div>

            {/* 서브디비전 선택 */}
            <SubdivisionSelector
              value={subdivision}
              onChange={async (s) => {
                setSubdivision(s);
                if (metronomeOn) {
                  stopMetronome();
                  await startMetronome(bpm, timeSignature, s, (beatIdx) => {
                    setCurrentBeat(beatIdx);
                  });
                }
              }}
            />

            {/* BPM 조절 + 토글 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBpmChange(bpm - 5)}
                className="w-7 h-7 rounded-lg text-xs text-neutral-600 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 transition-colors"
              >
                -5
              </button>
              <button
                onClick={() => handleBpmChange(bpm - 1)}
                className="w-7 h-7 rounded-lg text-xs text-neutral-600 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 transition-colors"
              >
                -
              </button>
              <span className="text-sm font-mono text-neutral-300 w-16 text-center tabular-nums">
                {bpm} BPM
              </span>
              <button
                onClick={() => handleBpmChange(bpm + 1)}
                className="w-7 h-7 rounded-lg text-xs text-neutral-600 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 transition-colors"
              >
                +
              </button>
              <button
                onClick={() => handleBpmChange(bpm + 5)}
                className="w-7 h-7 rounded-lg text-xs text-neutral-600 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 transition-colors"
              >
                +5
              </button>
              <button
                onClick={toggleMetronome}
                className={`px-3 h-7 rounded-lg text-xs transition-all duration-150 ${
                  metronomeOn
                    ? "bg-amber-400/15 text-amber-400 border border-amber-400/40"
                    : "bg-neutral-900 text-neutral-600 hover:text-neutral-400 border border-neutral-800"
                }`}
              >
                {metronomeOn ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Scale Coverage */}
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <div className="flex items-center gap-3 w-full">
              <span className="text-[10px] tracking-widest text-neutral-700 uppercase font-medium">
                Scale Coverage
              </span>
              <span className="text-[10px] text-neutral-700 font-mono ml-auto">
                {coverage.size} / {scale.intervals.length}
              </span>
            </div>

            <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400/60 rounded-full transition-all duration-500"
                style={{ width: `${(coverage.size / scale.intervals.length) * 100}%` }}
              />
            </div>

            <div className="flex gap-2 flex-wrap justify-center mt-1">
              {scale.intervals.map((interval, i) => {
                const nc = (rootMidi + interval) % 12;
                const played = coverage.has(nc);
                const noteName = NOTE_NAMES[nc];
                const isRoot = i === 0;

                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 ${
                        played
                          ? isRoot
                            ? "bg-amber-400 text-neutral-900"
                            : "bg-amber-400/15 text-amber-400 border border-amber-400/50"
                          : "bg-neutral-900 text-neutral-700 border border-neutral-800"
                      }`}
                      style={
                        played && !isRoot
                          ? { boxShadow: "0 0 8px rgba(251,191,36,0.3), 0 0 2px rgba(251,191,36,0.5)" }
                          : undefined
                      }
                    >
                      {noteName}
                    </div>
                    <span className="text-[9px] text-neutral-700 font-mono">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <div className="px-6 pt-4 pb-6 max-w-5xl w-full mx-auto">
        <p className="text-xs text-neutral-700 text-center">
          {mode === "click"
            ? `${NOTE_NAMES[rootIndex]} ${scale.name} 스케일에 속하는 음을 지판에서 클릭하세요`
            : `기타를 연주하면 음을 감지해 ${NOTE_NAMES[rootIndex]} ${scale.name} 스케일 여부를 판정합니다`}
        </p>
      </div>
    </main>
  );
}
