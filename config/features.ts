/**
 * 앱 기능 목록 단일 관리
 * - 메인 화면 카드 렌더링
 * - useFeatureNavigation의 Ctrl+←/→ 순서
 * 두 곳 모두 이 배열을 기준으로 동작하므로
 * 새 기능 추가 시 여기에만 추가하면 됩니다.
 */

export type FeatureConfig = {
  href: string;
  title: string;
  description: string;
};

export const FEATURES: FeatureConfig[] = [
  {
    href: "/metronome",
    title: "Metronome",
    description: "BPM · 박자 · Tap Tempo",
  },
  {
    href: "/tuner",
    title: "Tuner",
    description: "크로매틱 튜너 · 스트로보",
  },
  {
    href: "/scales",
    title: "Scale Guide",
    description: "스케일 · 모드 · 지판 시각화",
  },
];
