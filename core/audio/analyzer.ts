/**
 * 크로매틱 튜너 - 피치 감지 엔진
 *
 * YIN 알고리즘 (de Cheveigné & Kawahara, 2002)
 * - ACF 대비 옥타브 오류 대폭 감소
 * - 배음이 풍부한 기타/베이스에 최적
 * - 감지 범위: ~41Hz(베이스 E1) ~ 1320Hz(기타 E6)
 * - 입력 신호는 분석만 하고 브라우저 출력으로 연결하지 않음
 *   (오인페 직접 모니터링 시나리오 대응)
 */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const A4_FREQ = 440;
const A4_MIDI = 69;

const SILENCE_THRESHOLD = 0.004; // RMS 기준 무음 판별 (낮을수록 작은 소리도 감지)
const YIN_THRESHOLD     = 0.12;  // 낮을수록 정확하지만 미감지 증가 (권장: 0.08~0.15)

export type PitchResult = {
  note: string;
  octave: number;
  cents: number;  // -50 ~ +50
  frequency: number;
};

/**
 * YIN 알고리즘으로 기본 주파수 추출
 *
 * 1. 차이 함수(difference function) 계산
 * 2. 누적 평균 정규화(CMND) → 옥타브 오류 방지
 * 3. 임계값 이하 첫 번째 최솟값 탐색
 * 4. 포물선 보간으로 정밀도 향상
 *
 * @returns 주파수(Hz), 신호가 없거나 감지 실패 시 -1
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE     = buffer.length;
  const halfSize = Math.floor(SIZE / 2);

  // RMS로 무음 판별
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < SILENCE_THRESHOLD) return -1;

  // Step 1: 차이 함수 d(τ) = Σ(x(t) - x(t+τ))²
  const d = new Float32Array(halfSize);
  for (let tau = 1; tau < halfSize; tau++) {
    for (let i = 0; i < halfSize; i++) {
      const diff = buffer[i] - buffer[i + tau];
      d[tau] += diff * diff;
    }
  }

  // Step 2: 누적 평균 정규화 (CMND)
  // d'(0) = 1, d'(τ) = d(τ) * τ / Σd(1..τ)
  const yin = new Float32Array(halfSize);
  yin[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfSize; tau++) {
    runningSum += d[tau];
    yin[tau] = runningSum > 0 ? (d[tau] * tau) / runningSum : 0;
  }

  // Step 3: 임계값 이하 첫 번째 극소값 탐색
  let tau = 2;
  while (tau < halfSize - 1) {
    if (yin[tau] < YIN_THRESHOLD && yin[tau] <= yin[tau - 1] && yin[tau] <= yin[tau + 1]) {
      break;
    }
    tau++;
  }

  // 임계값 이하 극소값이 없으면 전역 최솟값으로 대체
  if (tau === halfSize - 1) {
    let minVal = Infinity;
    let minTau = 2;
    for (let i = 2; i < halfSize; i++) {
      if (yin[i] < minVal) {
        minVal = yin[i];
        minTau = i;
      }
    }
    // 신뢰도가 너무 낮으면 감지 실패
    if (minVal > 0.5) return -1;
    tau = minTau;
  }

  // Step 4: 포물선 보간(parabolic interpolation)으로 정밀도 향상
  if (tau > 1 && tau < halfSize - 1) {
    const s0 = yin[tau - 1];
    const s1 = yin[tau];
    const s2 = yin[tau + 1];
    const denom = s0 - 2 * s1 + s2;
    if (denom !== 0) {
      const refinement = (s0 - s2) / (2 * denom);
      if (isFinite(refinement) && Math.abs(refinement) < 1) {
        tau += refinement;
      }
    }
  }

  const freq = sampleRate / tau;

  // 유효 주파수 범위 체크 (베이스 B0 ~31Hz ~ 기타 E6 ~1319Hz)
  if (freq < 30 || freq > 1400) return -1;

  return freq;
}

/**
 * 주파수 → 음이름 + 옥타브 + cents 변환
 */
export function frequencyToNote(frequency: number): PitchResult | null {
  if (frequency <= 0) return null;

  const midiFloat = 12 * Math.log2(frequency / A4_FREQ) + A4_MIDI;
  const midiRound = Math.round(midiFloat);

  if (midiRound < 12 || midiRound > 120) return null;

  const cents     = Math.round((midiFloat - midiRound) * 100);
  const noteIndex = ((midiRound % 12) + 12) % 12;
  const octave    = Math.floor(midiRound / 12) - 1;

  return {
    note:      NOTE_NAMES[noteIndex],
    octave,
    cents,
    frequency: Math.round(frequency * 10) / 10,
  };
}
