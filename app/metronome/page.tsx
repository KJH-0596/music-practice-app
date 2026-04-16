"use client";

import Link from "next/link";
import { useMetronome } from "@/hooks/useMetronome";
import { BpmControl } from "@/components/BpmControl";
import { TimeSignatureSelector } from "@/components/TimeSignatureSelector";
import { BeatIndicator } from "@/components/BeatIndicator";
import { TransportControl } from "@/components/TransportControl";

export default function MetronomePage() {
  const {
    bpm,
    timeSignature,
    isPlaying,
    currentBeat,
    toggle,
    changeBpm,
    changeTimeSignature,
    tap,
  } = useMetronome();

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col">
      <header className="flex items-center px-6 pt-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 3L5.5 8l5 5" />
          </svg>
          홈
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-12">
          <h1 className="text-xs tracking-[0.3em] text-neutral-600 uppercase font-medium">
            Metronome
          </h1>
          <BeatIndicator
            totalBeats={timeSignature.beats}
            currentBeat={currentBeat}
            isPlaying={isPlaying}
          />
          <BpmControl bpm={bpm} onChange={changeBpm} />
          <TimeSignatureSelector
            value={timeSignature}
            onChange={changeTimeSignature}
          />
          <TransportControl
            isPlaying={isPlaying}
            onToggle={toggle}
            onTap={tap}
          />
        </div>
      </div>
    </main>
  );
}
