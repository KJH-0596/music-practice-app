"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMetronomeStore } from "@/store/useStore";
import { startAudioEngine } from "@/core/audio/engine";
import {
  startMetronome,
  stopMetronome,
  updateBpm,
} from "@/core/audio/metronome";

export function useMetronome() {
  const {
    bpm,
    timeSignature,
    subdivision,
    isPlaying,
    currentBeat,
    setBpm,
    setTimeSignature,
    setSubdivision,
    setIsPlaying,
    setCurrentBeat,
  } = useMetronomeStore();

  // 서브디비전 변경 (재생 중이면 재시작)
  const changeSubdivision = useCallback(
    async (s: typeof subdivision) => {
      setSubdivision(s);
      if (isPlaying) {
        stopMetronome();
        await startMetronome(bpm, timeSignature, s, (beatIndex) => {
          setCurrentBeat(beatIndex);
        });
      }
    },
    [isPlaying, bpm, timeSignature, setSubdivision, setCurrentBeat]
  );

  // Tap Tempo 계산을 위한 탭 히스토리
  const tapTimesRef = useRef<number[]>([]);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 재생/정지 토글
  const toggle = useCallback(async () => {
    // AudioContext 시작 (클릭 이벤트에서 호출되므로 브라우저 정책 통과)
    await startAudioEngine();

    if (isPlaying) {
      stopMetronome(); // 동기 실행
      setIsPlaying(false);
      setCurrentBeat(-1);
    } else {
      setIsPlaying(true);
      await startMetronome(bpm, timeSignature, subdivision, (beatIndex) => {
        setCurrentBeat(beatIndex);
      });
    }
  }, [isPlaying, bpm, timeSignature, setIsPlaying, setCurrentBeat]);

  // BPM 변경 (재생 중이면 Transport BPM만 실시간 업데이트)
  const changeBpm = useCallback(
    (newBpm: number) => {
      setBpm(newBpm);
      if (isPlaying) {
        updateBpm(newBpm); // 동기 실행
      }
    },
    [isPlaying, setBpm]
  );

  // 박자 변경 (재생 중이면 재시작)
  const changeTimeSignature = useCallback(
    async (ts: typeof timeSignature) => {
      setTimeSignature(ts);
      if (isPlaying) {
        stopMetronome();
        await startMetronome(bpm, ts, subdivision, (beatIndex) => {
          setCurrentBeat(beatIndex);
        });
      }
    },
    [isPlaying, bpm, setTimeSignature, setCurrentBeat]
  );

  // Tap Tempo
  const tap = useCallback(async () => {
    // 첫 탭에서도 AudioContext를 시작 (사용자 제스처)
    await startAudioEngine();

    const now = performance.now();

    // 2초 이상 간격이면 새로 시작
    if (
      tapTimesRef.current.length > 0 &&
      now - tapTimesRef.current[tapTimesRef.current.length - 1] > 2000
    ) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current = [...tapTimesRef.current, now].slice(-8);

    if (tapTimesRef.current.length >= 2) {
      const intervals = tapTimesRef.current
        .slice(1)
        .map((t, i) => t - tapTimesRef.current[i]);
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      changeBpm(Math.max(40, Math.min(240, newBpm)));
    }

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => {
      tapTimesRef.current = [];
    }, 2000);
  }, [changeBpm]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: 재생/정지 (body에 포커스가 있을 때만)
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggle();
      }
      // Tab: Tap Tempo (preventDefault는 GlobalKeyboardHandler에서 처리)
      if (e.code === "Tab") {
        tap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle, tap]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopMetronome();
    };
  }, []);

  return {
    bpm,
    timeSignature,
    subdivision,
    isPlaying,
    currentBeat,
    toggle,
    changeBpm,
    changeTimeSignature,
    changeSubdivision,
    tap,
  };
}
