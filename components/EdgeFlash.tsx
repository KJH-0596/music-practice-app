"use client";

/**
 * 화면 가장자리 순간 점등 효과
 * - correct: 초록 vignette (FPS 킬 확인 느낌)
 * - wrong:   빨간 vignette (FPS 피격 느낌)
 * flashKey가 바뀔 때마다 컴포넌트가 리마운트되어 애니메이션이 재생됩니다.
 */

interface EdgeFlashProps {
  type: "correct" | "wrong";
}

const COLORS = {
  correct: "rgba(34,197,94,0.55)",   // green-500
  wrong:   "rgba(239,68,68,0.55)",   // red-500
};

export function EdgeFlash({ type }: EdgeFlashProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        boxShadow: `inset 0 0 120px 40px ${COLORS[type]}`,
        animation: "edge-flash 0.4s ease-out forwards",
      }}
    />
  );
}
