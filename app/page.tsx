"use client";

import Link from "next/link";

type Feature = {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    href: "/metronome",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 24V10M14 10L9 20M14 10l5 10" />
        <path d="M8 24h16" />
        <circle cx="14" cy="7" r="2.5" />
      </svg>
    ),
    title: "Metronome",
    description: "BPM · 박자 · Tap Tempo",
  },
];

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
        {features.map((feature) => (
          <FeatureCard key={feature.href} {...feature} />
        ))}
      </div>
    </main>
  );
}

function FeatureCard({ href, icon, title, description }: Feature) {
  return (
    <Link
      href={href}
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
        <h2 className="text-white font-medium text-base mb-1">{title}</h2>
        <p className="text-neutral-500 text-sm">{description}</p>
      </div>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-200">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </div>
    </Link>
  );
}
