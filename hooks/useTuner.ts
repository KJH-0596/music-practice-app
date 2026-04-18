"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { detectPitch, frequencyToNote, type PitchResult } from "@/core/audio/analyzer";
import { useSettingsStore } from "@/store/useSettingsStore";

type TunerState = "idle" | "listening" | "error";

export function useTuner() {
  const [state, setState] = useState<TunerState>("idle");
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { audioDeviceId, inputGain } = useSettingsStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const gainNodeRef    = useRef<GainNode | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const rafRef         = useRef<number | null>(null);
  const bufferRef      = useRef<Float32Array<ArrayBuffer> | null>(null);

  // ── 스무딩 관련 refs ──────────────────────────────
  // 센트 지수이동평균 (α=0.15: 낮을수록 부드럽고 느림)
  const smoothedCentsRef = useRef<number>(0);
  // 음이름 안정화: 동일 음이 연속 N프레임 감지돼야 표시 전환
  const stableNoteRef    = useRef<string | null>(null);
  const stableCountRef   = useRef<number>(0);
  const STABLE_FRAMES = 3;  // 약 50ms @60fps
  const EMA_ALPHA     = 0.15;

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    gainNodeRef.current = null;
    bufferRef.current   = null;
    setPitch(null);
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    try {
      // 오인페 시나리오 최적화:
      // echoCancellation / noiseSuppression / autoGainControl 모두 끔
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioContext({ latencyHint: "interactive" });
      const analyser = audioContext.createAnalyser();
      // 4096: E2(82Hz) 기준 ~3.8주기 확보 → 저음 감지 안정성 향상
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;

      // 입력 게인: 작은 소리도 분석 가능하도록 증폭
      // destination 미연결 → 스피커 출력 없음 (피드백 위험 없음)
      const gainNode = audioContext.createGain();
      gainNode.gain.value = inputGain;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(gainNode);
      gainNode.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current     = analyser;
      gainNodeRef.current     = gainNode;
      streamRef.current       = stream;
      bufferRef.current       = new Float32Array(analyser.fftSize);

      setState("listening");
      setErrorMessage(null);

      // 피치 감지 루프 시작
      const loop = () => {
        if (!analyserRef.current || !bufferRef.current) return;

        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const freq = detectPitch(
          bufferRef.current,
          audioContextRef.current!.sampleRate
        );

        if (freq > 0) {
          const result = frequencyToNote(freq);
          if (result) {
            // 음이름 안정화: 같은 음이 STABLE_FRAMES 연속 감지돼야 전환
            if (result.note === stableNoteRef.current) {
              stableCountRef.current++;
            } else {
              stableNoteRef.current = result.note;
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
          // 무음: 스무딩 refs 초기화
          stableNoteRef.current  = null;
          stableCountRef.current = 0;
          smoothedCentsRef.current = 0;
          setPitch(null);
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      setErrorMessage("마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      setState("error");
    }
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return { state, pitch, errorMessage, start, stop };
}
