"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FEATURES } from "@/config/features";

/**
 * Ctrl+← / Ctrl+→ 로 기능 간 이동
 * FEATURES 배열 순서 기준으로 이전/다음 이동
 * 양 끝에서는 wrap-around (첫 번째 ↔ 마지막)
 *
 * @param currentHref 현재 페이지의 href (예: "/metronome")
 */
export function useFeatureNavigation(currentHref: string) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      e.preventDefault();

      const currentIndex = FEATURES.findIndex((f) => f.href === currentHref);
      if (currentIndex === -1) return;

      const total = FEATURES.length;
      const nextIndex =
        e.key === "ArrowRight"
          ? (currentIndex + 1) % total
          : (currentIndex - 1 + total) % total;

      router.push(FEATURES[nextIndex].href);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentHref, router]);
}
