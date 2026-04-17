"use client";

import { NOTE_NAMES } from "@/core/theory/constants";

interface RootSelectorProps {
  rootIndex: number; // 0~11 (C=0)
  onChange: (index: number) => void;
}

export function RootSelector({ rootIndex, onChange }: RootSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] tracking-widest text-neutral-600 uppercase font-medium">
        Root
      </span>
      <div className="flex flex-wrap gap-1.5">
        {NOTE_NAMES.map((note, i) => {
          const isActive = i === rootIndex;
          const isSharp = note.includes("#");
          return (
            <button
              key={note}
              onClick={() => onChange(i)}
              className={`
                h-9 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95
                ${isSharp ? "w-10" : "w-10"}
                ${isActive
                  ? "bg-amber-400 text-neutral-900 shadow-md shadow-amber-400/20"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                }
              `}
            >
              {note}
            </button>
          );
        })}
      </div>
    </div>
  );
}
