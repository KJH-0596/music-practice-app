/**
 * 메트로놈 핵심 로직
 * Tone.js Transport + Sequence로 정확한 타이밍 보장
 *
 * 핵심 설계:
 * - Tone 모듈은 engine.ts에서 캐싱 후 공유 → stopMetronome 완전 동기화
 * - startMetronome에서 stop → 새 시퀀스 시작 순서를 안전하게 보장
 */

import { getTone } from "./engine";
import type { TimeSignature } from "@/types/audio";

type BeatCallback = (beatIndex: number) => void;

let sequence: import("tone").Sequence | null = null;
let accentSynth: import("tone").Synth | null = null;
let normalSynth: import("tone").Synth | null = null;

function initSynths(Tone: typeof import("tone")) {
  if (accentSynth && normalSynth) return;

  // 강박 (똑): 삼각파 고음역 → 맑고 선명한 클릭
  accentSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.01 },
    volume: -4,
  }).toDestination();

  // 약박 (딱): 낮고 부드러운 클릭
  normalSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.013, sustain: 0, release: 0.008 },
    volume: -10,
  }).toDestination();
}

/**
 * 메트로놈 정지 — 완전 동기 실행
 * engine.ts에서 캐싱된 Tone 모듈을 사용하므로 동기 호출 안전
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
    // 예약된 모든 이벤트 제거 (이전 시퀀스 잔재 제거)
    Tone.getTransport().cancel();
  }
}

/**
 * 메트로놈 시작
 * stopMetronome()이 동기이므로 await 없이도 순서 보장
 */
export async function startMetronome(
  bpm: number,
  timeSignature: TimeSignature,
  onBeat: BeatCallback
): Promise<void> {
  // engine.ts의 startAudioEngine()이 먼저 호출되어 있으므로
  // 여기서는 캐싱된 모듈을 가져옴
  const Tone = await import("tone");

  // 1. 기존 시퀀스/Transport 완전 정지 (동기)
  stopMetronome();

  // 2. 신디사이저 초기화
  initSynths(Tone);

  // 3. BPM 설정
  Tone.getTransport().bpm.value = bpm;

  // 4. 박자 배열 생성 (0-based index)
  const beats = Array.from({ length: timeSignature.beats }, (_, i) => i);

  // 5. 시퀀스 생성
  // 6/8박자: 8분음표(8n) 간격으로 6박
  // 4/4박자: 4분음표(4n) 간격으로 4박
  const interval = `${timeSignature.division}n`;

  sequence = new Tone.Sequence(
    (time, beatIndex) => {
      const idx = beatIndex as number;
      const isAccent = idx === 0;
      const synth = isAccent ? accentSynth! : normalSynth!;
      // 강박: A5(880Hz) 높고 선명, 약박: E5(659Hz) 낮고 부드럽게
      const note = isAccent ? "A5" : "E5";

      synth.triggerAttackRelease(note, "64n", time);

      // UI 업데이트: Tone의 Draw 스케줄러로 메인 스레드에서 실행
      Tone.getDraw().schedule(() => {
        onBeat(idx);
      }, time);
    },
    beats,
    interval
  );

  // 6. 시작 (position 0부터)
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
