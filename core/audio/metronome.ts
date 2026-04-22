/**
 * 메트로놈 핵심 로직
 * Tone.js Transport + Sequence로 정확한 타이밍 보장
 *
 * 서브디비전 설계:
 * - 단일 Sequence를 서브디비전 간격으로 실행
 * - tickIndex % ticksPerBeat === 0 이면 메인 비트, 아니면 서브 클릭
 */

import { getTone } from "./engine";
import type { TimeSignature, SubdivisionType } from "@/types/audio";

type BeatCallback = (beatIndex: number) => void;

let sequence:     import("tone").Sequence | null = null;
let accentSynth:  import("tone").Synth   | null = null;
let normalSynth:  import("tone").Synth   | null = null;
let subSynth:     import("tone").Synth   | null = null;
let masterVolume: import("tone").Volume  | null = null;

// initSynths 실행 전에 슬라이더가 움직인 경우를 위한 pending 값
let _pendingVolumeDb = 0;

/**
 * 메트로놈 마스터 볼륨 실시간 변경 (재시작 없이)
 * @param db  -10 ~ +10 dB
 */
export function setMetronomeVolume(db: number): void {
  _pendingVolumeDb = Math.max(-10, Math.min(10, db));
  if (masterVolume) {
    masterVolume.volume.value = _pendingVolumeDb;
  }
}

function initSynths(Tone: typeof import("tone")) {
  if (accentSynth && normalSynth && subSynth) return;

  // 마스터 볼륨 노드: accentSynth/normalSynth/subSynth → masterVolume → destination
  masterVolume = new Tone.Volume(_pendingVolumeDb).toDestination();

  // 강박 (똑): 삼각파 고음역 → 맑고 선명한 클릭
  accentSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.01 },
    volume: -4,
  }).connect(masterVolume);

  // 약박 (딱): 낮고 부드러운 클릭
  normalSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.013, sustain: 0, release: 0.008 },
    volume: -10,
  }).connect(masterVolume);

  // 서브디비전: 더 작고 높은 클릭
  subSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.008, sustain: 0, release: 0.005 },
    volume: -20,
  }).connect(masterVolume);
}

/**
 * 서브디비전 타입 → Tone.js 간격 문자열 + 비트당 틱 수
 * division: TimeSignature.division (4 = 4분음표 기준, 8 = 8분음표 기준)
 */
function getSubdivisionConfig(
  division: number,
  subdivision: SubdivisionType
): { interval: string; ticksPerBeat: number } {
  switch (subdivision) {
    case "quarter":
      return { interval: `${division}n`,     ticksPerBeat: 1 };
    case "eighth":
      return { interval: `${division * 2}n`, ticksPerBeat: 2 };
    case "sixteenth":
      return { interval: `${division * 4}n`, ticksPerBeat: 4 };
    case "triplet":
      // division * 2 번째 음표의 3연음: ex) 4/4 → "8t"
      return { interval: `${division * 2}t`, ticksPerBeat: 3 };
  }
}

/**
 * 메트로놈 정지 — 완전 동기 실행
 */
export function stopMetronome(): void {
  if (sequence) {
    sequence.stop();
    sequence.dispose();
    sequence = null;
  }

  const Tone = getTone();
  if (Tone) {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }
}

/**
 * 메트로놈 시작
 */
export async function startMetronome(
  bpm: number,
  timeSignature: TimeSignature,
  subdivision: SubdivisionType,
  onBeat: BeatCallback
): Promise<void> {
  const Tone = await import("tone");

  stopMetronome();
  initSynths(Tone);

  Tone.getTransport().bpm.value = bpm;

  const { interval, ticksPerBeat } = getSubdivisionConfig(
    timeSignature.division,
    subdivision
  );

  // 전체 틱 수: 박자 수 × 비트당 틱
  const totalTicks = timeSignature.beats * ticksPerBeat;
  const ticks = Array.from({ length: totalTicks }, (_, i) => i);

  sequence = new Tone.Sequence(
    (time, tickIndex) => {
      const idx = tickIndex as number;
      const beatIndex = Math.floor(idx / ticksPerBeat);
      const subIndex  = idx % ticksPerBeat;
      const isMainBeat = subIndex === 0;
      const isAccent   = beatIndex === 0;

      if (isMainBeat) {
        const synth = isAccent ? accentSynth! : normalSynth!;
        const note  = isAccent ? "A5" : "E5";
        synth.triggerAttackRelease(note, "64n", time);

        Tone.getDraw().schedule(() => {
          onBeat(beatIndex);
        }, time);
      } else {
        // 서브디비전 클릭
        subSynth!.triggerAttackRelease("B5", "64n", time);
      }
    },
    ticks,
    interval
  );

  sequence.start(0);
  Tone.getTransport().start();
}

/**
 * BPM만 실시간 변경 (재시작 없이)
 */
export function updateBpm(bpm: number): void {
  const Tone = getTone();
  if (Tone) {
    Tone.getTransport().bpm.value = bpm;
  }
}
