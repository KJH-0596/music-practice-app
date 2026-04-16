"use client";

import { useMetronome } from "@/hooks/useMetronome";
import { BpmControl } from "@/components/BpmControl";
import { TimeSignatureSelector } from "@/components/TimeSignatureSelector";
import { BeatIndicator } from "@/components/BeatIndicator";
import { TransportControl } from "@/components/TransportControl";

export default function HomePage() {
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
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-12">

        {/* 앱 타이틀 */}
        <div className="text-center">
          <h1 className="text-xs tracking-[0.3em] text-neutral-600 uppercase font-medium">
            Metronome
          </h1>
        </div>

        {/* 비트 인디케이터 */}
        <BeatIndicator
          totalBeats={timeSignature.beats}
          currentBeat={currentBeat}
          isPlaying={isPlaying}
        />

        {/* BPM 컨트롤 */}
        <BpmControl bpm={bpm} onChange={changeBpm} />

        {/* 박자 선택 */}
        <TimeSignatureSelector
          value={timeSignature}
          onChange={changeTimeSignature}
        />

        {/* 재생/정지 + Tap Tempo */}
        <TransportControl
          isPlaying={isPlaying}
          onToggle={toggle}
          onTap={tap}
        />

      </div>
    </main>
  );
}
