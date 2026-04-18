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
    title: "메트로놈",
    description: "Tap Tempo 기능을 포함한 기본적인 메트로놈입니다.",
  },
  {
    href: "/tuner",
    title: "튜너",
    description: "기본적인 튜너입니다.",
  },
  {
    href: "/scales",
    title: "스케일 가이드",
    description: "여러 종류의 스케일을 지판에서 확인할 수 있습니다.",
  },
  {
    href: "/quiz",
    title: "트레이닝",
    description: "스케일을 외웠는지 테스트합니다.",
  },
];
