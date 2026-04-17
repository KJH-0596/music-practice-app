/**
 * 크로매틱 튜너 - 피치 감지 엔진
 *
 * 자동상관(Autocorrelation) 알고리즘으로 기본 주파수 감지
 * - 감지 범위: ~41Hz(베이스 E1) ~ 1320Hz(기타 E6)
 * - 입력 신호는 분석만 하고 브라우저 출력으로 연결하지 않음
 *   (오인페 직접 모니터링 시나리오 대응)
 */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const A4_FREQ = 440;
const A4_MIDI = 69;
const SILENCE_THRESHOLD = 0.01; // RMS 기준 무음 판별

export type PitchResult = {
  note: string;
  octave: number; // 확장용 (현재 UI에서는 미표시)
  cents: number;  // -50 ~ +50
  frequency: number;
};

/**
 * 자동상관 알고리즘으로 기본 주파수 추출
 * @returns 주파수(Hz), 신호가 없으면 -1
 */
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;

  // RMS로 무음 판별
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < SILENCE_THRESHOLD) return -1;

  const MAX_LAG = Math.floor(SIZE / 2);
  const c = new Float32Array(MAX_LAG);

  // 자동상관 계수 계산
  for (let lag = 0; lag < MAX_LAG; lag++) {
    let sum = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    c[lag] = sum;
  }

  // 첫 번째 극소값(첫 피크 이후) 탐색
  let d = 0;
  while (d < MAX_LAG - 1 && c[d] > c[d + 1]) d++;

  // 극소값 이후 최대 상관 구간 탐색
  let bestLag = -1;
  let bestCorr = 0;
  for (let i = d; i < MAX_LAG; i++) {
    const normalized = c[i] / c[0];
    if (normalized > bestCorr) {
      bestCorr = normalized;
      bestLag = i;
    }
  }

  // 상관도가 낮으면 유효하지 않은 피치
  if (bestLag === -1 || bestCorr < 0.5) return -1;

  // 포물선 보간(parabolic interpolation)으로 정밀도 향상
  if (bestLag > 0 && bestLag < MAX_LAG - 1) {
    const a = c[bestLag - 1];
    const b = c[bestLag];
    const cc = c[bestLag + 1];
    const denom = a - 2 * b + cc;
    if (denom !== 0) {
      const refinement = (a - cc) / (2 * denom);
      if (isFinite(refinement) && Math.abs(refinement) < 1) {
        bestLag += refinement;
      }
    }
  }

  return sampleRate / bestLag;
}

/**
 * 주파수 → 음이름 + 옥타브 + cents 변환
 */
export function frequencyToNote(frequency: number): PitchResult | null {
  if (frequency <= 0) return null;

  const midiFloat = 12 * Math.log2(frequency / A4_FREQ) + A4_MIDI;
  const midiRound = Math.round(midiFloat);

  if (midiRound < 12 || midiRound > 120) return null; // 유효 범위 밖

  const cents = Math.round((midiFloat - midiRound) * 100);
  const noteIndex = ((midiRound % 12) + 12) % 12;
  const octave = Math.floor(midiRound / 12) - 1;

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    frequency: Math.round(frequency * 10) / 10,
  };
}
