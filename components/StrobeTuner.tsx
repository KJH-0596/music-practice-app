"use client";

import type { PitchResult } from "@/core/audio/analyzer";

interface StrobeTunerProps {
  pitch: PitchResult | null;
  isListening: boolean;
}

const IN_TUNE_THRESHOLD = 4; // ±4cents 이내를 인튠으로 판정

export function StrobeTuner({ pitch, isListening }: StrobeTunerProps) {
  const cents = pitch?.cents ?? 0;
  const note = pitch?.note ?? null;

  const inTune = pitch !== null && Math.abs(cents) <= IN_TUNE_THRESHOLD;
  const isFlat = pitch !== null && cents < -IN_TUNE_THRESHOLD;
  const isSharp = pitch !== null && cents > IN_TUNE_THRESHOLD;

  // cents 절댓값에 따른 스트로보 속도 (초/주기)
  // 작을수록 빠름. 최소 0.15s, 최대 8s
  const absCents = Math.abs(cents);
  const strobeDuration =
    pitch === null || inTune
      ? 0 // 애니메이션 없음
      : Math.max(0.15, 8 - absCents * 0.14);

  // 편차 방향: flat = 왼쪽 이동(normal), sharp = 오른쪽 이동(reverse)
  const strobeDirection = isFlat ? "normal" : "reverse";

  // 인튠 상태 색상
  const noteColor = inTune
    ? "text-amber-400"
    : isFlat
    ? "text-blue-400"
    : isSharp
    ? "text-red-400"
    : "text-neutral-500";

  const segmentColor = inTune
    ? "#F59E0B" // amber
    : isFlat
    ? "#60A5FA" // blue
    : isSharp
    ? "#F87171" // red
    : "#404040"; // idle gray

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">

      {/* 음이름 디스플레이 */}
      <div className="relative flex flex-col items-center gap-1 h-36 justify-center">
        {note ? (
          <>
            <span
              className={`text-8xl font-light tabular-nums leading-none transition-colors duration-150 ${noteColor}`}
            >
              {note}
            </span>
            {inTune && (
              <span className="absolute -bottom-1 text-[10px] tracking-widest text-amber-400 uppercase font-medium animate-pulse">
                in tune
              </span>
            )}
          </>
        ) : (
          <span className="text-8xl font-light text-neutral-800 leading-none select-none">
            —
          </span>
        )}
      </div>

      {/* 스트로보 바 + 센트 표시 */}
      <div className="flex flex-col items-center gap-3 w-full">

        {/* 센트 표시 */}
        <div className="flex items-baseline gap-1 h-5">
          {pitch ? (
            <>
              <span className={`text-sm font-mono tabular-nums transition-colors duration-150 ${noteColor}`}>
                {cents > 0 ? `+${cents}` : cents}
              </span>
              <span className="text-xs text-neutral-600">¢</span>
            </>
          ) : (
            <span className="text-sm text-neutral-800">—</span>
          )}
        </div>

        {/* 스트로보 세그먼트 바 */}
        <div className="relative w-full h-7 overflow-hidden rounded-sm bg-neutral-900">

          {/* 움직이는 세그먼트 패턴 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                ${segmentColor} 0px,
                ${segmentColor} 4px,
                transparent 4px,
                transparent 12px
              )`,
              animation:
                strobeDuration > 0
                  ? `strobe-scroll ${strobeDuration}s linear infinite ${strobeDirection}`
                  : "none",
              opacity: pitch ? 0.85 : 0.2,
              transition: "background-image 0.15s",
            }}
          />

          {/* 중앙 기준선 */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-px w-0.5 bg-neutral-700 z-10" />

          {/* 인튠 시 중앙 글로우 */}
          {inTune && (
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-amber-400/10 blur-sm z-10" />
          )}
        </div>

        {/* flat / sharp 레이블 */}
        <div className="flex justify-between w-full px-1">
          <span className={`text-[10px] tracking-widest uppercase transition-colors duration-150 ${isFlat ? "text-blue-400" : "text-neutral-700"}`}>
            flat
          </span>
          <span className={`text-[10px] tracking-widest uppercase transition-colors duration-150 ${isSharp ? "text-red-400" : "text-neutral-700"}`}>
            sharp
          </span>
        </div>
      </div>
    </div>
  );
}
