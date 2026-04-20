"use client";

import { type SubdivisionType } from "@/types/audio";

interface SubdivisionSelectorProps {
  value: SubdivisionType;
  onChange: (s: SubdivisionType) => void;
}

// ── 음표 SVG 아이콘 ──────────────────────────────────────────
// viewBox 기준: 가로 14~22, 세로 22 (버튼 내 렌더 크기 12x20)

const QuarterNoteIcon = () => (
  <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
    {/* 음표 머리 */}
    <ellipse cx="5" cy="16" rx="4.5" ry="3.2" transform="rotate(-18 5 16)" />
    {/* 기둥 */}
    <rect x="9" y="1.5" width="1.6" height="14" rx="0.8" />
  </svg>
);

const EighthNoteIcon = () => (
  <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
    <ellipse cx="5" cy="16" rx="4.5" ry="3.2" transform="rotate(-18 5 16)" />
    <rect x="9" y="1.5" width="1.6" height="14" rx="0.8" />
    {/* 깃발 */}
    <path
      d="M10.6 1.5 C14 4 14 9 10.6 11"
      stroke="currentColor" strokeWidth="1.6"
      fill="none" strokeLinecap="round"
    />
  </svg>
);

const SixteenthNoteIcon = () => (
  <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
    <ellipse cx="5" cy="16" rx="4.5" ry="3.2" transform="rotate(-18 5 16)" />
    <rect x="9" y="1.5" width="1.6" height="14" rx="0.8" />
    {/* 첫 번째 깃발 */}
    <path
      d="M10.6 1.5 C14 3.5 14 7.5 10.6 9.5"
      stroke="currentColor" strokeWidth="1.6"
      fill="none" strokeLinecap="round"
    />
    {/* 두 번째 깃발 */}
    <path
      d="M10.6 5.5 C14 7.5 14 11.5 10.6 13.5"
      stroke="currentColor" strokeWidth="1.6"
      fill="none" strokeLinecap="round"
    />
  </svg>
);

const TripletIcon = () => (
  <svg width="22" height="20" viewBox="0 0 22 20" fill="currentColor">
    {/* "3" 레이블 */}
    <text x="11" y="5.5" textAnchor="middle" fontSize="5.5" fontFamily="monospace" fill="currentColor">3</text>
    {/* 빔 */}
    <rect x="1.5" y="7" width="19" height="1.5" rx="0.75" />
    {/* 왼쪽 음표 */}
    <rect x="1.5" y="7" width="1.5" height="8" rx="0.75" />
    <ellipse cx="2.5" cy="16.5" rx="3.8" ry="2.7" transform="rotate(-18 2.5 16.5)" />
    {/* 가운데 음표 */}
    <rect x="10.2" y="7" width="1.5" height="8" rx="0.75" />
    <ellipse cx="11" cy="16.5" rx="3.8" ry="2.7" transform="rotate(-18 11 16.5)" />
    {/* 오른쪽 음표 */}
    <rect x="19" y="7" width="1.5" height="8" rx="0.75" />
    <ellipse cx="19.8" cy="16.5" rx="3.8" ry="2.7" transform="rotate(-18 19.8 16.5)" />
  </svg>
);

const ICONS: Record<SubdivisionType, React.ReactNode> = {
  quarter:   <QuarterNoteIcon />,
  eighth:    <EighthNoteIcon />,
  sixteenth: <SixteenthNoteIcon />,
  triplet:   <TripletIcon />,
};

const LABELS: Record<SubdivisionType, string> = {
  quarter:   "4분음표",
  eighth:    "8분음표",
  sixteenth: "16분음표",
  triplet:   "셋잇단음표",
};

const SUBDIVISIONS: SubdivisionType[] = ["quarter", "eighth", "sixteenth", "triplet"];

export function SubdivisionSelector({ value, onChange }: SubdivisionSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] tracking-widest text-neutral-700 uppercase font-medium">
        Subdivision
      </span>
      <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
        {SUBDIVISIONS.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            title={LABELS[type]}
            className={`px-3 h-8 rounded-md flex items-center justify-center transition-all duration-150 ${
              value === type
                ? "bg-neutral-700 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            {ICONS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
