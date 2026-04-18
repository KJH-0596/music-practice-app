"use client";

import { SCALES, SCALE_CATEGORY_LABEL, type ScaleConfig, type ScaleCategory } from "@/core/theory/scales";

interface ScaleSelectorProps {
  selectedId: string;
  onChange: (scale: ScaleConfig) => void;
}

const CATEGORY_ORDER: ScaleCategory[] = ["standard", "jazz", "dark", "rock_blues"];

export function ScaleSelector({ selectedId, onChange }: ScaleSelectorProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    scales: SCALES.filter((s) => s.category === cat),
  }));

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[10px] tracking-widest text-neutral-600 uppercase font-medium">
        Scale / Mode
      </span>

      {grouped.map(({ category, scales }) => (
        <div key={category} className="flex flex-col gap-1.5">
          <span className="text-[10px] text-neutral-700 uppercase tracking-widest pl-1">
            {SCALE_CATEGORY_LABEL[category]}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {scales.map((scale) => {
              const isActive = scale.id === selectedId;
              return (
                <button
                  key={scale.id}
                  onClick={() => onChange(scale)}
                  className={`
                    px-3 h-9 rounded-lg text-sm transition-all duration-150 active:scale-95 whitespace-nowrap
                    ${isActive
                      ? "bg-amber-400 text-neutral-900 font-medium shadow-md shadow-amber-400/20"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                    }
                  `}
                >
                  {scale.koreanName}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
