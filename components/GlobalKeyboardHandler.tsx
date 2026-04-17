"use client";

import { useEffect } from "react";

/**
 * 전역 키보드 핸들러
 * - Tab 키: 포커스 이동 전역 차단
 *   (각 페이지에서 Tab에 별도 동작을 붙일 수 있음, 예: 메트로놈 Tap Tempo)
 */
export function GlobalKeyboardHandler() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return null;
}
