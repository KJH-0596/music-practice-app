"use client";

interface TransportControlProps {
  isPlaying: boolean;
  onToggle: () => void;
  onTap: () => void;
}

export function TransportControl({
  isPlaying,
  onToggle,
  onTap,
}: TransportControlProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Tap Tempo */}
      <button
        onClick={onTap}
        className="
          px-5 py-3 rounded-xl text-sm font-medium
          bg-neutral-800 text-neutral-400
          hover:bg-neutral-700 hover:text-neutral-200
          active:scale-95 transition-all duration-150
          select-none
        "
      >
        Tap
      </button>

      {/* 재생/정지 */}
      <button
        onClick={onToggle}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center
          text-neutral-900 font-bold text-xl
          transition-all duration-200 active:scale-95 select-none
          ${
            isPlaying
              ? "bg-amber-400 shadow-lg shadow-amber-400/30 hover:bg-amber-300"
              : "bg-white hover:bg-neutral-200 shadow-lg shadow-white/10"
          }
        `}
        aria-label={isPlaying ? "정지" : "재생"}
      >
        {isPlaying ? (
          // 정지 아이콘
          <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
            <rect x="3" y="2" width="6" height="18" rx="1.5" />
            <rect x="13" y="2" width="6" height="18" rx="1.5" />
          </svg>
        ) : (
          // 재생 아이콘
          <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
            <path d="M5 3.5l14 7.5-14 7.5V3.5z" />
          </svg>
        )}
      </button>

      {/* 스페이스바 힌트 */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-neutral-700 px-2 py-1 rounded border border-neutral-800 font-mono">
          SPACE
        </span>
      </div>
    </div>
  );
}
