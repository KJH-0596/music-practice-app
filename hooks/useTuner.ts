"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { frequencyToNote, type PitchResult } from "@/core/audio/analyzer";
import { WorkletAnalyzer } from "@/core/audio/worklet-analyzer";
import { useSettingsStore } from "@/store/useSettingsStore";

type TunerState = "idle" | "listening" | "error";

// ── 스무딩 설정 ────────────────────────────────────────────────────
// Wad.js 자기상관은 correlation > 0.9 조건으로 신뢰도 높은 결과만 출력하므로
// STABLE_FRAMES를 줄여도 안정적입니다.
const EMA_ALPHA        = 0.2;  // 자기상관 출력이 안정적이므로 약간 높임
const STABLE_FRAMES    = 5;    // 동일 음이름 연속 감지 수 (5 × 23ms ≈ 115ms)
const SILENCE_HOLD     = 8;    // 연속 무음 프레임 수 (~184ms 후 디스플레이 클리어)
const MIN_CENTS_CHANGE = 2;    // 표시 갱신 최소 센트 변화 (깜빡임 억제)

export function useTuner() {
  const [state, setState]        = useState<TunerState>("idle");
  const [pitch, setPitch]        = useState<PitchResult | null>(null);
  const [errorMessage, setError] = useState<string | null>(null);

  const { audioDeviceId, inputChannel, inputGain } = useSettingsStore();

  // Web Audio 노드 refs
  const ctxRef      = useRef<AudioContext | null>(null);
  const gainRef     = useRef<GainNode | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<WorkletAnalyzer | null>(null);

  // 스무딩 refs (렌더링 없이 유지)
  const smoothedCentsRef    = useRef<number>(0);
  const stableNoteRef       = useRef<string | null>(null);
  const stableCountRef      = useRef<number>(0);
  // 표시 안정화 refs
  const silenceFramesRef    = useRef<number>(0);    // 연속 무음 프레임 카운터
  const lastRenderedCentsRef = useRef<number>(999); // 이전 표시 cents (변화량 필터용)

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

    smoothedCentsRef.current     = 0;
    stableNoteRef.current        = null;
    stableCountRef.current       = 0;
    silenceFramesRef.current     = 0;
    lastRenderedCentsRef.current = 999;

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
      // useEffect 등 사용자 제스처 외부에서 생성된 경우 suspended 상태일 수 있음
      if (ctx.state === "suspended") await ctx.resume();

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
          // 유효 주파수: 무음 카운터 리셋
          silenceFramesRef.current = 0;

          const result = frequencyToNote(freq);
          if (result) {
            // 음이름 안정화 + EMA (같은 음일 때만 누적)
            if (result.note === stableNoteRef.current) {
              stableCountRef.current++;
              smoothedCentsRef.current =
                EMA_ALPHA * result.cents +
                (1 - EMA_ALPHA) * smoothedCentsRef.current;
            } else {
              stableNoteRef.current        = result.note;
              stableCountRef.current       = 1;
              smoothedCentsRef.current     = result.cents; // 음 변경 시 즉시 리셋
              lastRenderedCentsRef.current = 999;           // cents 변화량 필터 리셋
            }

            if (stableCountRef.current >= STABLE_FRAMES) {
              const cents = Math.round(smoothedCentsRef.current);
              // 같은 음이름이고 cents 변화가 MIN_CENTS_CHANGE 미만이면 갱신 생략
              // → 미세 진동으로 인한 깜빡임 억제
              if (Math.abs(cents - lastRenderedCentsRef.current) >= MIN_CENTS_CHANGE) {
                lastRenderedCentsRef.current = cents;
                setPitch({ ...result, cents });
              }
            }
          }
        } else {
          // 무음 프레임: SILENCE_HOLD 프레임 연속 무음 확인 후 클리어
          // → 음과 음 사이의 짧은 끊김에 표시가 깜빡이는 현상 방지
          silenceFramesRef.current++;
          if (silenceFramesRef.current >= SILENCE_HOLD) {
            stableNoteRef.current        = null;
            stableCountRef.current       = 0;
            smoothedCentsRef.current     = 0;
            lastRenderedCentsRef.current = 999;
            setPitch(null);
          }
        }
      });

      gainNode.connect(wa.node!);
      wa.setChannel(inputChannel);

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
  }, [audioDeviceId, inputChannel, inputGain]);

  // 채널 변경 → 재시작 없이 즉시 적용
  useEffect(() => {
    analyzerRef.current?.setChannel(inputChannel);
  }, [inputChannel]);

  // 입력 게인 변경 → 재시작 없이 즉시 적용
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = inputGain;
    }
  }, [inputGain]);

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
