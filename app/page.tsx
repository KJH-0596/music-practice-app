"use client";

import Link from "next/link";
import { FEATURES, type FeatureConfig } from "@/config/features";

// 아이콘은 JSX라 config에 넣기 어려우므로 href 기준으로 여기서 매핑
const ICONS: Record<string, React.ReactNode> = {
  "/metronome": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 24V10M14 10L9 20M14 10l5 10" />
      <path d="M8 24h16" />
      <circle cx="14" cy="7" r="2.5" />
    </svg>
  ),
  "/tuner": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="16" r="7" />
      <path d="M14 9V5" />
      <path d="M10 5h8" />
      <path d="M14 16l-3-4" />
    </svg>
  ),
  "/scales": (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="22" height="12" rx="2" />
      <line x1="3" y1="14" x2="25" y2="14" />
      <line x1="9" y1="8" x2="9" y2="20" />
      <line x1="14" y1="8" x2="14" y2="20" />
      <line x1="19" y1="8" x2="19" y2="20" />
      <circle cx="6.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="21.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-16">
        <p className="text-xs tracking-[0.3em] text-neutral-600 uppercase font-medium mb-3">
          Music Practice App
        </p>
        <h1 className="text-3xl font-light text-white tracking-tight">
          실용음악 연습 도구
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl">
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.href}
            feature={feature}
            icon={ICONS[feature.href]}
          />
        ))}
      </div>

      {/* 키보드 단축키 힌트 */}
      {FEATURES.length > 1 && (
        <p className="mt-12 text-xs text-neutral-700">
          기능 페이지에서 <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 font-mono">←</kbd><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 font-mono">→</kbd> 로 기능 간 이동
        </p>
      )}
    </main>
  );
}

function FeatureCard({ feature, icon }: { feature: FeatureConfig; icon: React.ReactNode }) {
  return (
    <Link
      href={feature.href}
      className="
        group relative flex flex-col gap-4 p-6 rounded-2xl
        bg-neutral-900 border border-neutral-800
        hover:border-amber-400/40 hover:bg-neutral-800/80
        transition-all duration-200 cursor-pointer
      "
    >
      <div className="text-amber-400 group-hover:scale-110 transition-transform duration-200 w-fit">
        {icon}
      </div>
      <div>
        <h2 className="text-white font-medium text-base mb-1">{feature.title}</h2>
        <p className="text-neutral-500 text-sm">{feature.description}</p>
      </div>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-200">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </div>
    </Link>
  );
}
