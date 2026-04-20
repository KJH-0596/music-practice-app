/**
 * PitchProcessor — AudioWorkletProcessor
 *
 * YIN 알고리즘을 오디오 전용 스레드에서 실행해 레이턴시·지터 최소화.
 *
 * 설계 근거:
 * - BUFFER_SIZE 2048: halfSize=1024 → min freq ≈ 43 Hz
 *   기타 E2(82 Hz) 커버, 연산량 4096 대비 1/4
 * - HOP_SIZE 256: ~5.8 ms @44100 Hz, 부드러운 갱신
 * - sampleRate: AudioWorkletGlobalScope 전역 변수 (브라우저가 주입)
 */

const BUFFER_SIZE       = 2048;
const HOP_SIZE          = 256;
const SILENCE_THRESHOLD = 0.004;
const YIN_THRESHOLD     = 0.12;

// ── YIN 알고리즘 ─────────────────────────────────────────────────

function detectPitch(buf) {
  const SIZE     = buf.length;
  const halfSize = SIZE >> 1;

  // RMS 무음 판별
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / SIZE) < SILENCE_THRESHOLD) return -1;

  // Step 1: 차이 함수 d(τ)
  const d = new Float32Array(halfSize);
  for (let tau = 1; tau < halfSize; tau++) {
    for (let i = 0; i < halfSize; i++) {
      const diff = buf[i] - buf[i + tau];
      d[tau] += diff * diff;
    }
  }

  // Step 2: CMND (누적 평균 정규화)
  const yin = new Float32Array(halfSize);
  yin[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfSize; tau++) {
    runningSum += d[tau];
    yin[tau] = runningSum > 0 ? (d[tau] * tau) / runningSum : 0;
  }

  // Step 3: 임계값 이하 첫 극소값
  let tau = 2;
  while (tau < halfSize - 1) {
    if (
      yin[tau] < YIN_THRESHOLD &&
      yin[tau] <= yin[tau - 1] &&
      yin[tau] <= yin[tau + 1]
    ) break;
    tau++;
  }

  if (tau === halfSize - 1) {
    let minVal = Infinity, minTau = 2;
    for (let i = 2; i < halfSize; i++) {
      if (yin[i] < minVal) { minVal = yin[i]; minTau = i; }
    }
    if (minVal > 0.5) return -1;
    tau = minTau;
  }

  // Step 4: 포물선 보간
  if (tau > 1 && tau < halfSize - 1) {
    const s0 = yin[tau - 1], s1 = yin[tau], s2 = yin[tau + 1];
    const denom = s0 - 2 * s1 + s2;
    if (denom !== 0) {
      const r = (s0 - s2) / (2 * denom);
      if (isFinite(r) && Math.abs(r) < 1) tau += r;
    }
  }

  const freq = sampleRate / tau;         // sampleRate: AudioWorkletGlobalScope 전역
  return (freq < 30 || freq > 1400) ? -1 : freq;
}

// ── Processor ────────────────────────────────────────────────────

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._ring       = new Float32Array(BUFFER_SIZE);
    this._writePos   = 0;      // 절대 샘플 카운트
    this._hopCounter = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    // 링 버퍼에 샘플 기록
    for (let i = 0; i < channel.length; i++) {
      this._ring[this._writePos % BUFFER_SIZE] = channel[i];
      this._writePos++;
    }

    // 버퍼가 채워지기 전까지 분석 생략
    if (this._writePos < BUFFER_SIZE) return true;

    // HOP_SIZE 샘플마다 YIN 실행
    this._hopCounter += channel.length;
    if (this._hopCounter < HOP_SIZE) return true;
    this._hopCounter = 0;

    // 링 버퍼 → 연속 배열로 복사 (오래된 순서대로)
    const buf   = new Float32Array(BUFFER_SIZE);
    const start = this._writePos % BUFFER_SIZE;
    for (let i = 0; i < BUFFER_SIZE; i++) {
      buf[i] = this._ring[(start + i) % BUFFER_SIZE];
    }

    const frequency = detectPitch(buf);

    // Transferable 전송으로 복사 비용 0
    const out = new Float32Array(1);
    out[0] = frequency;
    this.port.postMessage(out, [out.buffer]);

    return true;
  }
}

registerProcessor("pitch-processor", PitchProcessor);
