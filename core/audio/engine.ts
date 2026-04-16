/**
 * AudioContext 초기화 및 Tone.js 모듈 캐싱
 * - 브라우저 정책상 사용자 인터랙션 이후에만 AudioContext 시작 가능
 * - Tone 모듈 참조를 캐싱해서 metronome.ts와 공유 (동기 접근 가능하도록)
 */

let _tone: typeof import("tone") | null = null;

export async function startAudioEngine(): Promise<void> {
  if (!_tone) {
    _tone = await import("tone");
  }
  // AudioContext가 suspended 상태면 resume
  if (_tone.getContext().state !== "running") {
    await _tone.start();
  }
}

/** 캐싱된 Tone 모듈 반환 (초기화 전이면 null) */
export function getTone(): typeof import("tone") | null {
  return _tone;
}
