/**
 * WorkletAnalyzer
 *
 * AudioWorkletNode 생성·연결·정리를 담당하는 래퍼.
 * pitch-processor.js 가 주파수를 Float32Array(1)로 postMessage하면
 * onFrequency 콜백을 호출합니다.
 *
 * 사용 예:
 *   const wa = new WorkletAnalyzer();
 *   await wa.init(audioContext, (freq) => { ... });
 *   source.connect(gainNode).connect(wa.node!);
 *   // 정리
 *   wa.dispose();
 */

export class WorkletAnalyzer {
  private _node: AudioWorkletNode | null = null;

  get node(): AudioWorkletNode | null {
    return this._node;
  }

  async init(
    ctx: AudioContext,
    onFrequency: (freq: number) => void
  ): Promise<void> {
    // 이미 초기화됐으면 재사용
    if (this._node) return;

    // Next.js static export: public/worklets/ → /worklets/
    await ctx.audioWorklet.addModule("/worklets/pitch-processor.js");

    this._node = new AudioWorkletNode(ctx, "pitch-processor", {
      numberOfInputs:  1,
      numberOfOutputs: 0,   // 출력 없음 (분석 전용, 스피커 연결 안 함)
    });

    this._node.port.onmessage = (e: MessageEvent<Float32Array>) => {
      onFrequency(e.data[0]);
    };
  }

  dispose(): void {
    if (this._node) {
      this._node.port.onmessage = null;
      this._node.disconnect();
      this._node = null;
    }
  }
}
