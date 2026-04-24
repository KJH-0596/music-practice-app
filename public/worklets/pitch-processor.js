/**
 * PitchProcessor — AudioWorkletProcessor
 *
 * Wad.js (web-audio-daw) autoCorrelate 알고리즘 기반
 * melvin78/guitar-tuner 참고
 *
 * 핵심 아이디어:
 *  - AMDF(Average Magnitude Difference Function)의 역수를 자기상관으로 사용
 *    correlation(offset) = 1 - mean(|buf[i] - buf[i+offset]|)
 *  - correlation > GOOD_CORR_THRES(0.9) 조건을 만족하는 첫 번째 피크 → 기본 주파수 주기
 *  - 피크 주변 포물선 보간으로 정밀도 향상
 *  - 히스테리시스 무음 감지로 오인페 저신호 환경 대응
 *
 * 파라미터:
 *  BUFFER_SIZE   4096 → 링 버퍼 크기
 *  HOP_SIZE      1024 → 분석 주기 ≈ 23 ms @44100 Hz
 *  CORR_SIZE     2048 → 자기상관 계산 창 크기
 *  MAX_SAMPLES   1764 → 최저 감지 ≈ 25 Hz (44100/25)
 *  MIN_SAMPLES     32 → 최고 감지 ≈ 1378 Hz (44100/32)
 */

const BUFFER_SIZE       = 4096;
const HOP_SIZE          = 1024;
const CORR_SIZE         = 2048;   // 자기상관 계산 창
const MIN_SAMPLES       = 32;     // 최고 주파수 한계 ≈ 1378 Hz
const MAX_SAMPLES       = 1764;   // 최저 주파수 한계 ≈ 25 Hz (CORR_SIZE + MAX_SAMPLES ≤ BUFFER_SIZE)
const GOOD_CORR_THRES   = 0.9;    // 양호 상관 임계값 (Wad.js 동일)
const MIN_CORR          = 0.01;   // 최소 상관 임계값 (무신호 판별)
const ONSET_THRESHOLD   = 0.003;  // 히스테리시스 발음 감지 임계값
const RELEASE_THRESHOLD = 0.001;  // 히스테리시스 무음 전환 임계값

// ── 자기상관 피치 감지 ───────────────────────────────────────────
// Wad.js autoCorrelate 참고, float 신호(-1~+1)에 맞게 적용
// 포물선 보간 추가로 정밀도 향상

function autoCorrelate(buf) {
  if (buf.length < CORR_SIZE + MAX_SAMPLES) return -1;

  let bestOffset      = -1;
  let bestCorrelation = 0;
  let lastCorrelation = 1;
  let foundGoodCorr   = false;

  // 상관 피크 주변 보간을 위해 직전 두 상관값 보존
  let corrPrev2 = 0; // offset - 2 상관값
  let corrPrev1 = 0; // offset - 1 상관값

  for (let offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
    let sum = 0;
    for (let i = 0; i < CORR_SIZE; i++) {
      sum += Math.abs(buf[i] - buf[i + offset]);
    }
    const correlation = 1 - (sum / CORR_SIZE);

    // Wad.js 핵심: correlation > 0.9 이면서 상승 중이면 "양호 상관 발견"
    if (correlation > GOOD_CORR_THRES && correlation > lastCorrelation) {
      foundGoodCorr = true;
    } else if (foundGoodCorr) {
      // 직전 offset이 피크 → 포물선 보간으로 정밀 주기 산출
      // x1=corrPrev2, x2=corrPrev1(피크), x3=correlation
      const x1 = corrPrev2;
      const x2 = corrPrev1; // 피크 (bestOffset에 해당)
      const x3 = correlation;
      const denom = x1 - 2 * x2 + x3;
      let refinedOffset = bestOffset;
      if (denom !== 0) {
        const r = (x1 - x3) / (2 * denom);
        if (isFinite(r) && Math.abs(r) < 1) {
          refinedOffset = bestOffset + r;
        }
      }
      const freq = sampleRate / refinedOffset;
      return (freq >= 25 && freq <= 1400) ? freq : -1;
    }

    corrPrev2 = corrPrev1;
    corrPrev1 = correlation;
    lastCorrelation = correlation;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset      = offset;
    }
  }

  // 루프 종료 후에도 bestCorrelation이 최소 기준 이상이면 반환
  if (bestCorrelation > MIN_CORR && bestOffset > 0) {
    const freq = sampleRate / bestOffset;
    return (freq >= 25 && freq <= 1400) ? freq : -1;
  }

  return -1;
}

// ── Processor ────────────────────────────────────────────────────

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._ring       = new Float32Array(BUFFER_SIZE);
    this._writePos   = 0;
    this._hopCounter = 0;
    this._channelIdx = 0;
    this._isActive   = false; // 히스테리시스 상태

    // 3프레임 슬라이딩 중앙값 필터 (단발 이상치·옥타브 오류 제거)
    this._freqHistory  = new Float32Array(3).fill(-1);
    this._historyPos   = 0;

    this.port.onmessage = (e) => {
      if (e.data?.type === "setChannel") {
        this._channelIdx             = e.data.channel ?? 0;
        this._isActive               = false;
        this._freqHistory.fill(-1);
        this._historyPos             = 0;
      }
    };
  }

  process(inputs, outputs) {
    const inputChannels = inputs[0];
    const channel       = inputChannels?.[this._channelIdx] ?? inputChannels?.[0];

    // 무음 출력 — audio graph 활성 유지
    const silentOut = outputs[0]?.[0];
    if (silentOut) silentOut.fill(0);

    if (!channel) return true;

    // 링 버퍼에 샘플 기록
    for (let i = 0; i < channel.length; i++) {
      this._ring[this._writePos % BUFFER_SIZE] = channel[i];
      this._writePos++;
    }

    if (this._writePos < BUFFER_SIZE) return true;

    // HOP_SIZE 샘플마다 분석
    this._hopCounter += channel.length;
    if (this._hopCounter < HOP_SIZE) return true;
    this._hopCounter = 0;

    // 링 버퍼 → 연속 배열 (시간 순서대로)
    const buf   = new Float32Array(BUFFER_SIZE);
    const start = this._writePos % BUFFER_SIZE;
    for (let i = 0; i < BUFFER_SIZE; i++) {
      buf[i] = this._ring[(start + i) % BUFFER_SIZE];
    }

    // ── 히스테리시스: RMS로 발음/무음 상태 전환 ────────────────────
    // ONSET > RELEASE 구조: 감쇠 구간 조기 무음 처리
    let sumSq = 0;
    for (let i = 0; i < BUFFER_SIZE; i++) sumSq += buf[i] * buf[i];
    const rms = Math.sqrt(sumSq / BUFFER_SIZE);

    if (!this._isActive) {
      if (rms >= ONSET_THRESHOLD)  this._isActive = true;
    } else {
      if (rms < RELEASE_THRESHOLD) this._isActive = false;
    }

    if (!this._isActive) {
      this._freqHistory.fill(-1);
      this._historyPos = 0;
      const out = new Float32Array(1);
      out[0] = -1;
      this.port.postMessage(out, [out.buffer]);
      return true;
    }

    // ── 자기상관 피치 감지 ─────────────────────────────────────────
    const rawFreq = autoCorrelate(buf);

    // ── 3프레임 슬라이딩 중앙값 필터 ────────────────────────────────
    // 유효 주파수만 히스토리에 기록, 무효(-1)는 건너뜀
    if (rawFreq > 0) {
      this._freqHistory[this._historyPos % 3] = rawFreq;
      this._historyPos++;
    }

    // 히스토리에서 유효값만 추출해 중앙값 계산
    const valid = [];
    for (let i = 0; i < 3; i++) {
      if (this._freqHistory[i] > 0) valid.push(this._freqHistory[i]);
    }
    let frequency = rawFreq;
    if (valid.length >= 2) {
      valid.sort((a, b) => a - b);
      frequency = valid[Math.floor(valid.length / 2)];
    }

    const out = new Float32Array(1);
    out[0] = frequency;
    this.port.postMessage(out, [out.buffer]);

    return true;
  }
}

registerProcessor("pitch-processor", PitchProcessor);
