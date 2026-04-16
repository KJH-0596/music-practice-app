"use client";

import { TIME_SIGNATURES } from "@/types/audio";
import type { TimeSignature } from "@/types/audio";

interface TimeSignatureSelectorProps {
  value: TimeSignature;
  onChange: (ts: TimeSignature) => void;
}

export function TimeSignatureSelector({
  value,
  onChange,
}: TimeSignatureSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
        Time Signature
      </span>

      <div className="flex gap-2">
        {TIME_SIGNATURES.map((ts) => {
          const isActive =
            ts.beats === value.beats && ts.division === value.division;

          return (
            <button
              key={`${ts.beats}/${ts.division}`}
              onClick={() => onChange(ts)}
              className={`
                w-14 h-14 rounded-xl font-semibold text-sm transition-all duration-200
                ${
                  isActive
                    ? "bg-amber-400 text-neutral-900 shadow-lg shadow-amber-400/20"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                }
              `}
            >
              <span className="flex flex-col items-center leading-none">
                <span className="text-base">{ts.beats}</span>
                <span className="border-t border-current w-4 my-0.5" />
                <span className="text-base">{ts.division}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
