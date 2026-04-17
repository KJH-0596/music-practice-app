"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { autoCorrelate, frequencyToNote, type PitchResult } from "@/core/audio/analyzer";

type TunerState = "idle" | "listening" | "error";

export function useTuner() {
  const [state, setState] = useState<TunerState>("idle");
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

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
    bufferRef.current = null;
    setPitch(null);
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    try {
      // 오인페 시나리오 최적화:
      // echoCancellation / noiseSuppression / autoGainControl 모두 끔
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0; // 즉각적인 반응

      const source = audioContext.createMediaStreamSource(stream);
      // destination 연결 안 함: 브라우저로 소리 출력 방지
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;
      bufferRef.current = new Float32Array(analyser.fftSize);

      setState("listening");
      setErrorMessage(null);

      // 피치 감지 루프 시작
      const loop = () => {
        if (!analyserRef.current || !bufferRef.current) return;

        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const freq = autoCorrelate(
          bufferRef.current,
          audioContextRef.current!.sampleRate
        );

        if (freq > 0) {
          const result = frequencyToNote(freq);
          setPitch(result);
        } else {
          setPitch(null); // 무음
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
