"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { frequencyToNote, type PitchResult } from "@/core/audio/analyzer";
import { WorkletAnalyzer } from "@/core/audio/worklet-analyzer";
import { useSettingsStore } from "@/store/useSettingsStore";

type TunerState = "idle" | "listening" | "error";

// ── 스무딩 설정 ────────────────────────────────────────────────────
const EMA_ALPHA    = 0.15;   // 낮을수록 부드럽고 느림
const STABLE_FRAMES = 3;     // 동일 음이름 연속 감지 수 (안정화)

export function useTuner() {
  const [state, setState]        = useState<TunerState>("idle");
  const [pitch, setPitch]        = useState<PitchResult | null>(null);
  const [errorMessage, setError] = useState<string | null>(null);

  const { audioDeviceId, inputGain } = useSettingsStore();

  // Web Audio 노드 refs
  const ctxRef      = useRef<AudioContext | null>(null);
  const gainRef     = useRef<GainNode | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<WorkletAnalyzer | null>(null);

  // 스무딩 refs (렌더링 없이 유지)
  const smoothedCentsRef = useRef<number>(0);
  const stableNoteRef    = useRef<string | null>(null);
  const stableCountRef   = useRef<number>(0);

  // ── 정지 ──────────────────────────────────────────────────────
  const stop = useCallback(() => {
    analyzerRef.current?.dispose();
    analyzerRef.current = null;

    gainRef.current?.disconnect();
    gainRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    ctxRef.current?.close();
    ctxRef.current = null;

    smoothedCentsRef.current = 0;
    stableNoteRef.current    = null;
    stableCountRef.current   = 0;

    setPitch(null);
    setState("idle");
  }, []);

  // ── 시작 ──────────────────────────────────────────────────────
  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
          echoCancellation:  false,
          noiseSuppression:  false,
          autoGainControl:   false,
        },
      });

      const ctx = new AudioContext({ latencyHint: "interactive" });

      // 입력 게인: 작은 신호도 분석 가능하도록 증폭
      // destination 미연결 → 스피커 출력 없음 (피드백 방지)
      const gainNode = ctx.createGain();
      gainNode.gain.value = inputGain;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(gainNode);

      // WorkletAnalyzer 초기화 및 연결
      const wa = new WorkletAnalyzer();
      await wa.init(ctx, (freq: number) => {
        // AudioWorklet → 메인 스레드 콜백
        if (freq > 0) {
          const result = frequencyToNote(freq);
          if (result) {
            // 음이름 안정화
            if (result.note === stableNoteRef.current) {
              stableCountRef.current++;
            } else {
              stableNoteRef.current  = result.note;
              stableCountRef.current = 1;
            }

            // 센트 EMA 스무딩
            smoothedCentsRef.current =
              EMA_ALPHA * result.cents +
              (1 - EMA_ALPHA) * smoothedCentsRef.current;

            if (stableCountRef.current >= STABLE_FRAMES) {
              setPitch({
                ...result,
                cents: Math.round(smoothedCentsRef.current),
              });
            }
          }
        } else {
          // 무음: refs 초기화
          stableNoteRef.current    = null;
          stableCountRef.current   = 0;
          smoothedCentsRef.current = 0;
          setPitch(null);
        }
      });

      gainNode.connect(wa.node!);

      ctxRef.current    = ctx;
      gainRef.current   = gainNode;
      streamRef.current = stream;
      analyzerRef.current = wa;

      setState("listening");
      setError(null);
    } catch (err) {
      console.error(err);
      setError("마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      setState("error");
    }
  }, [audioDeviceId, inputGain]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      analyzerRef.current?.dispose();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
    };
  }, []);

  return { state, pitch, errorMessage, start, stop };
}
