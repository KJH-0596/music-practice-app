"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTuner } from "@/hooks/useTuner";
import { useFeatureNavigation } from "@/hooks/useFeatureNavigation";
import { StrobeTuner } from "@/components/StrobeTuner";

export default function TunerPage() {
  const { state, pitch, errorMessage, start, stop } = useTuner();
  useFeatureNavigation("/tuner");

  // 페이지 진입 = 튜닝 의사 → 자동 시작
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isListening = state === "listening";

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">
      {/* 상단 네비게이션 */}
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

      {/* 튜너 UI */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="flex flex-col items-center gap-12 w-full max-w-sm">

          <h1 className="text-xs tracking-[0.3em] text-neutral-600 uppercase font-medium">
            Tuner
          </h1>

          {/* 스트로보 디스플레이 */}
          <StrobeTuner pitch={pitch} isListening={isListening} />

          {/* 에러 메시지 */}
          {errorMessage && (
            <p className="text-xs text-red-400 text-center">{errorMessage}</p>
          )}

          {/* 시작/정지 버튼 */}
          <button
            onClick={isListening ? stop : start}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              text-neutral-900 transition-all duration-200 active:scale-95 select-none
              ${isListening
                ? "bg-amber-400 shadow-lg shadow-amber-400/30 hover:bg-amber-300"
                : "bg-white hover:bg-neutral-200 shadow-lg shadow-white/10"
              }
            `}
            aria-label={isListening ? "정지" : "다시 시작"}
          >
            {isListening ? (
              /* 정지 아이콘 */
              <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
                <rect x="3" y="2" width="6" height="18" rx="1.5" />
                <rect x="13" y="2" width="6" height="18" rx="1.5" />
              </svg>
            ) : (
              /* 마이크 아이콘 */
              <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
                <rect x="8" y="1" width="6" height="11" rx="3" />
                <path d="M4 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                <line x1="11" y1="17" x2="11" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="7" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            )}
          </button>

          {/* 안내 문구 */}
          {isListening ? (
            <p className="text-[11px] text-neutral-700 text-center leading-relaxed">
              오디오 인터페이스 입력을 사용합니다.<br />
              기타/베이스 소리를 직접 모니터링하면서 튜닝하세요.
            </p>
          ) : (
            !errorMessage && (
              <p className="text-[11px] text-neutral-700 text-center leading-relaxed">
                버튼을 눌러 다시 시작하세요.
              </p>
            )
          )}

        </div>
      </div>
    </main>
  );
}
