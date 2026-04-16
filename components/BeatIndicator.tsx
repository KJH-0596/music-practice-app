"use client";

interface BeatIndicatorProps {
  totalBeats: number;
  currentBeat: number;
  isPlaying: boolean;
}

export function BeatIndicator({
  totalBeats,
  currentBeat,
  isPlaying,
}: BeatIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: totalBeats }, (_, i) => {
        const isAccent = i === 0;
        const isActive = isPlaying && i === currentBeat;

        return (
          <div
            key={i}
            className={`
              rounded-full transition-all duration-75
              ${isAccent ? "w-5 h-5" : "w-4 h-4"}
              ${
                isActive && isAccent
                  ? "bg-amber-400 shadow-lg shadow-amber-400/50 scale-125"
                  : isActive
                  ? "bg-amber-300 shadow-md shadow-amber-300/30 scale-110"
                  : isAccent
                  ? "bg-neutral-600"
                  : "bg-neutral-700"
              }
            `}
          />
        );
      })}
    </div>
  );
}
